import { state } from '../state';

import EnvelopeFollower from './envelopefollower';

export default class PlayerInstrument {
  constructor(instrument, channel, note, time, finished) {
    this.channel = channel;
    this.instrument = instrument;
    this.note = note;
    this.sourceNode = instrument.ctx.createBufferSource();
    this.gainNode = instrument.ctx.createGain();
    this.panningNode = instrument.ctx.createStereoPanner();
    this.gainNode.connect(this.panningNode);
    this.panningNode.connect(channel.gainNode);
    this.period = instrument.periodForNote(note, channel.fine);
    this.rate = this.rateForPeriod(this.period);
    this.sourceNode.playbackRate.value = this.rate;
    this.sourceNode.connect(this.gainNode);
    this.sample = instrument.samples[instrument.inst.samplemap[note]];
    this.sourceNode.buffer = this.sample.buffer;
    this.sourceNode.loop = this.sample.loop;
    this.sourceNode.loopStart = this.sample.loopStart;
    this.sourceNode.loopEnd = this.sample.loopEnd;
    this.volumeEnvelope = new EnvelopeFollower(instrument.envelopes.volume);
    this.fadeOutVol = 65536;
    this.panningEnvelope = new EnvelopeFollower(instrument.envelopes.panning);
    this.sourceNode.onended = () => this.onEnded();
    this.startTime = time;
    this.finished = finished;
    this.release = false;

    this.offset = 0;
    if (channel.off != null && channel.off > 0) {
      this.offset = (this.sample.buffer.duration / this.sample.buffer.length) * channel.off;
    }
    this.sourceNode.start(this.startTime, this.offset);
  }

  updateVolumeEnvelope(time, globalVolume) {
    if (this.release) {
      this.fadeOutVol -= this.instrument.inst.fadeout;
      if (this.fadeOutVol < 0) {
        return true;
      }
    }
    let volE = this.volumeEnvelope.Tick(this.release, 64.0, 0.0) / 64.0;
    const panE = (this.panningEnvelope.Tick(this.release, 32.0, 32.0) - 32) / 32.0;

    // Fade out
    volE *= this.fadeOutVol / 65536;

    // panE is -1 to 1
    // channel.pan is 0 to 255
    const pan = Math.max(-1, Math.min(1, panE + ((this.channel.pan - 128) / 128.0)));  // final pan
    // globalVolume is 0-128
    // volE is 0-1
    // channel.vol is 0-64
    const vol = Math.max(0, Math.min(1, (globalVolume / 128) * volE * (this.channel.vol / 64)));

    this.gainNode.gain.linearRampToValueAtTime(vol, time);
    this.panningNode.pan.linearRampToValueAtTime(pan, time);

    if (this.release && (volE <= 0)) {
      return true;
    }

    return false;
  }

  stop(time) {
    this.gainNode.gain.linearRampToValueAtTime(0, time);
    this.sourceNode.stop(time);
  }

  onEnded() {
    this.gainNode.disconnect();
    this.sourceNode.disconnect();
    if (this.finished && typeof this.finished === 'function') {
      this.finished(this);
    }
  }

  updateChannelPeriod(time, period) {
    const rate = this.rateForPeriod(period);
    this.sourceNode.playbackRate.setValueAtTime(rate, time);
  }

  rateForPeriod(period) {
    let freq;

    if (state.song.get('flags') & 0x1) { // eslint-disable-line no-bitwise
      freq = 8363 * (2 ** ((4608.0 - period) / 768.0));
    } else {
      freq = (8363 * 1712.0) / period;
    }
    if (isNaN(freq)) {
      console.log('invalid period!', period);
      return 0;
    }
    const rate = freq / this.instrument.ctx.sampleRate;
    return rate;
  }

  getCurrentPosition() {
    const time = this.instrument.ctx.currentTime;
    const currentTime = this.offset + (time - this.startTime);
    let offset = this.rate * currentTime;

    // Check if the position is outside the normal loop (taking into account doubling up for
    // ping-pong looping).
    let loopLen = this.sample.loopEnd - this.sample.loopStart;
    let loopPoint = this.sample.loopEnd;
    if (this.sample.loopType === 2) {
      loopPoint = this.sample.loopStart + (loopLen / 2.0);
      loopLen /= 2.0;
    }
    if (this.sample.loop && (offset > loopPoint)) {
      let loopCount = 0;
      let loopOffset = offset;
      while (loopOffset > loopPoint) {
        loopOffset -= loopLen;
        loopCount += 1;
      }

      if (this.sample.loopType === 2 && (loopCount & 1) === 1) { // eslint-disable-line no-bitwise
        offset = loopPoint - (loopOffset - this.sample.loopStart);
      } else {
        offset = loopOffset;
      }
    }

    const position = (offset / this.sample.buffer.duration) * this.sample.buffer.length;

    return position;
  }

  resetEnvelopes() {
    this.volumeEnvelope.reset();
    this.panningEnvelope.reset();
  }
}
