import { state } from '../state';
import { song } from '../utils/songmanager';

import PlayerInstrument from './playerinstrument';
import Envelope from './envelope';

export default class Instrument {
  constructor(instrumentIndex, ctx) {
    this.inst = song.getInstrument(instrumentIndex);
    this.instrumentIndex = instrumentIndex;
    this.ctx = ctx;
    this.samples = [];
    this.envelopes = {
      volume: undefined,
      panning: undefined,
    };
    // amiga period value table
    this.periodtable = new Float32Array([
      907.0, 900.0, 894.0, 887.0, 881.0, 875.0, 868.0, 862.0,
      856.0, 850.0, 844.0, 838.0, 832.0, 826.0, 820.0, 814.0,
      808.0, 802.0, 796.0, 791.0, 785.0, 779.0, 774.0, 768.0,
      762.0, 757.0, 752.0, 746.0, 741.0, 736.0, 730.0, 725.0,
      720.0, 715.0, 709.0, 704.0, 699.0, 694.0, 689.0, 684.0,
      678.0, 675.0, 670.0, 665.0, 660.0, 655.0, 651.0, 646.0,
      640.0, 636.0, 632.0, 628.0, 623.0, 619.0, 614.0, 610.0,
      604.0, 601.0, 597.0, 592.0, 588.0, 584.0, 580.0, 575.0,
      570.0, 567.0, 563.0, 559.0, 555.0, 551.0, 547.0, 543.0,
      538.0, 535.0, 532.0, 528.0, 524.0, 520.0, 516.0, 513.0,
      508.0, 505.0, 502.0, 498.0, 494.0, 491.0, 487.0, 484.0,
      480.0, 477.0, 474.0, 470.0, 467.0, 463.0, 460.0, 457.0,
      453.0, 450.0, 447.0, 445.0, 442.0, 439.0, 436.0, 433.0,
      428.0,
    ]);

    // Build AudioBuffers from the sample data stored in the song
    if (this.inst.samples && this.inst.samples.length > 0) {
      for (let i = 0; i < this.inst.samples.length; i += 1) {
        let sample = {};
        if (this.inst.samples[i].len > 0) {
          let buflen = this.inst.samples[i].len;
          if (this.inst.samples[i].type & 2) { // eslint-disable-line no-bitwise
            buflen += this.inst.samples[i].looplen;
          }
          const buf = ctx.createBuffer(1, buflen, ctx.sampleRate);
          const chan = buf.getChannelData(0);
          let loop = false;
          let loopType = 0;
          let loopStart = -1;
          let loopEnd = -1;
          try {
            // If pingpong loop, duplicate the loop section in reverse
            if (this.inst.samples[i].type & 2) { // eslint-disable-line no-bitwise
              let s;
              let t;
              for (s = 0; s < this.inst.samples[i].loop + this.inst.samples[i].looplen; s += 1) {
                chan[s] = this.inst.samples[i].sampledata.data[s];
              }
              // Duplicate loop section in reverse
              for (t = s - 1; t >= this.inst.samples[i].loop; t -= 1, s += 1) {
                chan[s] = this.inst.samples[i].sampledata.data[t];
              }
              loop = true;
              loopType = 2;
              loopStart = (buf.duration / buf.length) * this.inst.samples[i].loop;
              loopEnd = loopStart + ((buf.duration / buf.length) * (this.inst.samples[i].looplen * 2));
            } else {
              for (let s = 0; s < this.inst.samples[0].len; s += 1) {
                chan[s] = this.inst.samples[i].sampledata.data[s];
              }
              if ((this.inst.samples[i].type & 3) === 1 && this.inst.samples[i].looplen !== 0) { // eslint-disable-line no-bitwise
                loop = true;
                loopType = 1;
                loopStart = (buf.duration / buf.length) * this.inst.samples[i].loop;
                loopEnd = loopStart + ((buf.duration / buf.length) * this.inst.samples[i].looplen);
              }
            }
          } catch (e) {
            console.log(e);
          }
          sample = {
            buffer: buf,
            loop,
            loopType,
            loopStart,
            loopEnd,
          };
        }
        this.samples.push(sample);
      }
    }
    this.refreshEnvelopeData();
  }

  playNoteOnChannel(channel, time, note, finished) {
    if (this.samples[this.inst.samplemap[note]].buffer) {
      return new PlayerInstrument(this, channel, note, time, finished);
    }
    return null;
  }

  periodForNote(note, fine) {
    const sampNote = this.inst.samples[this.inst.samplemap[Math.min(Math.max(note, 0), 95)]].note;
    if (state.song.get('flags') & 0x1) { // eslint-disable-line no-bitwise
      return 7680.0 - ((note + sampNote) * 64) - (fine / 2.0);
    }
    const n2 = note + sampNote;
    let ft = Math.floor(fine / 16.0);
    const p1 = this.periodtable[8 + ((n2 % 12) * 8) + ft];
    const p2 = this.periodtable[8 + ((n2 % 12) * 8) + ft + 1];
    ft = (fine / 16.0) - ft;
    const pv = (((1.0 - ft) * p1) + (ft * p2)) * (16.0 / (2 ** (Math.floor(n2 / 12) - 1)));
    return pv;
  }

  refreshEnvelopeData() {
    this.envelopes.volume = undefined;
    this.envelopes.panning = undefined;
    if (this.inst.env_vol) {
      this.envelopes.volume = new Envelope(
        this.inst.env_vol.points,
        this.inst.env_vol.type,
        this.inst.env_vol.sustain,
        this.inst.env_vol.loopstart,
        this.inst.env_vol.loopend
      );
    }
    if (this.inst.env_pan) {
      this.envelopes.panning = new Envelope(
        this.inst.env_pan.points,
        this.inst.env_pan.type,
        this.inst.env_pan.sustain,
        this.inst.env_pan.loopstart,
        this.inst.env_pan.loopend
      );
    }
  }
}
