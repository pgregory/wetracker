import Immutable from 'immutable';
import Signal from '../utils/signal';

import { state } from '../state';
import { song } from '../utils/songmanager';
import Envelope from './envelope';

import TimerWorker from 'shared-worker!./timerworker';

export const SILENT = 'silent';
export const SOLO = 'solo';
export const MUTE = 'mute';
export const NORMAL = 'normal';
export const OFF = 'off';

class EnvelopeFollower {
  constructor(env) {
    this.env = env;
    this.tick = 0;
  }

  Tick(release, def = 64.0) {
    if(this.env != null && (this.env.type & 0x1) !== 0) {
      var value = this.env.Get(this.tick);

      if (value != null) {
        // if we're sustaining a note, stop advancing the tick counter
        if (this.env.type & 2) {
          if (!release && this.tick >= this.env.points[this.env.sustain*2]) {
            return this.env.points[this.env.sustain*2 + 1];
          }
        }

        // TODO: Need to take into account vol_fadeout when releasing.
        this.tick++;
        if (this.env.type & 4) {  // envelope loop?
          if (this.tick >= this.env.loopend) {
            this.tick = this.env.loopstart;
          }
        }
        return value;
      }
    }
    return def;
  }

  reset() {
    this.tick = 0;
  }
}

class XMViewObject {
  constructor(player) {
      this.audio_events = [],
      this.paused_events = [],
      this.shown_row = undefined,
      this.shown_pat = undefined,
      this._scope_width = 50,

      this.player = player;

      this.redrawScreen = this.redrawScreen.bind(this);
  }

  pause() {
    // grab all the audio events
    var t = this.player.audioctx.currentTime;
    while (this.audio_events.length > 0) {
      var e = this.audio_events.shift();
      e.t -= t;
      this.paused_events.push(e);
    }
  }

  resume() {
    var t = this.player.audioctx.currentTime;
    while (this.paused_events.length > 0) {
      var e = this.paused_events.shift();
      e.t += t;
      this.audio_events.push(e);
    }
    window.requestAnimationFrame(this.redrawScreen);
  }

  stop() {
    this.audio_events = [];
    this.paused_events = [];
  }

  start() {
    window.requestAnimationFrame(this.redrawScreen);
  }

  pushEvent(e) {
    this.audio_events.push(e);
    if(this.audio_events.length == 1) {
      window.requestAnimationFrame(this.redrawScreen);
    }
  }

  redrawScreen() {
    var e;
    var t = this.player.audioctx.currentTime;
    while (this.audio_events.length > 0 && this.audio_events[0].t <= t) {
      e = this.audio_events.shift();
    }
    if (!e) {
      if (this.player.playing || this.player.playingInteractive) {
        window.requestAnimationFrame(this.redrawScreen);
      }
      return;
    }
    if('row' in e && 'pat' in e) {
      if(e.row !== this.shown_row ||
         e.pat !== this.shown_pat) {
        state.set({
          cursor: {
            row: e.row,
            pattern: e.pat,
            sequence: e.songpos,
          },
        });
        this.shown_row = e.row;
        this.shown_pat = e.pat;
      }
    }
    const scopes = [];
    const states = [];

    const numtracks = song.getNumTracks();
    for (let j = 0; j < numtracks; j += 1) {
      const ch = this.player.tracks[j];
      ch.updateAnalyserScopeData();
      scopes.push({
        scopeData: ch.analyserScopeData,
        bufferLength: ch.analyserBufferLength,
      });

      states.push(ch.getState());
    }
    state.set({
      tracks: {
        t: e.t,
        vu: e.vu,
        scopes,
        states,
      }
    });

    const positions = [];
    for(let i = 0; i < this.player.playingInstruments.length; i += 1) {
      const pInstr = this.player.playingInstruments[i];
      if(!pInstr.release) {
        if(pInstr.instrument.instrumentIndex > positions.length || positions[pInstr.instrument.instrumentIndex] == null) {
          positions[pInstr.instrument.instrumentIndex] = [];
        }
        positions[pInstr.instrument.instrumentIndex].push({
          instrument: pInstr,
          position: pInstr.getCurrentPosition()
        });
      }
    }
    state.set({
      playingInstruments: {
        positions,
      }
    });

    if(this.player.playing || this.player.playingInteractive) {
      window.requestAnimationFrame(this.redrawScreen);
    }
  }
}

class PlayerInstrument {
  constructor(instrument, channel, note, time, finished) {
    this.channel = channel;
    this.instrument = instrument;
    this.note = note;
    this.sourceNode = instrument.ctx.createBufferSource();
    this.gainNode = instrument.ctx.createGain();
    this.panningNode = instrument.ctx.createStereoPanner();
    this.gainNode.connect(this.panningNode);
    this.panningNode.connect(channel.gainNode);
    this.period = instrument.periodForNote(channel, note, channel.fine);
    this.rate = this.rateForPeriod(this.period);
    this.sourceNode.playbackRate.value = this.rate;
    this.sourceNode.connect(this.gainNode);
    this.sample = instrument.samples[instrument.inst.samplemap[note]];
    this.sourceNode.buffer = this.sample.buffer;
    this.sourceNode.loop = this.sample.loop;
    this.sourceNode.loopStart = this.sample.loopStart;
    this.sourceNode.loopEnd = this.sample.loopEnd;
    this.volumeEnvelope = new EnvelopeFollower(instrument.envelopes.volume);
    this.panningEnvelope = new EnvelopeFollower(instrument.envelopes.panning);
    this.sourceNode.onended = () => this.onEnded();
    this.startTime = time;
    this.finished = finished;

    this.offset = 0;
    if (channel.off != null && channel.off > 0) {
      this.offset = (this.sample.buffer.duration / this.sample.buffer.length) * channel.off;
    }
    this.sourceNode.start(this.startTime, this.offset);
  }

  updateVolumeEnvelope(time, release) {
    let volE = this.volumeEnvelope.Tick(release) / 64.0;
    let panE = (this.panningEnvelope.Tick(release, 32.0) - 32) / 32.0;

    // panE is -1 to 1
    // channel.pan is 0 to 255 
    let pan = Math.max(-1, Math.min(1, panE + ((this.channel.pan - 128) / 128.0)));  // final pan
    // globalVolume is 0-128
    // volE is 0-1
    // channel.vol is 0-64
    let vol = Math.max(0, Math.min(1, (player.globalVolume / 128) * volE * (this.channel.vol / 64)));

    this.gainNode.gain.linearRampToValueAtTime(vol, time);
    this.panningNode.pan.linearRampToValueAtTime(pan, time);
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
    var rate = this.rateForPeriod(period);

    //this.sourceNode.playbackRate.value = rate;
    this.sourceNode.playbackRate.setValueAtTime(rate, time);
  }

  rateForPeriod(period) {
    var freq = 8363 * Math.pow(2, (1152.0 - period) / 192.0);
    if (isNaN(freq)) {
      console.log("invalid period!", period);
      return 0;
    }
    var rate = freq / this.instrument.ctx.sampleRate;
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
      loopPoint = this.sample.loopStart + (loopLen/2.0);
      loopLen /= 2.0;
    }
    if(this.sample.loop && (offset > loopPoint)) {
      let loopCount = 0;
      let loopOffset = offset;
      while (loopOffset > loopPoint) {
        loopOffset -= loopLen;
        loopCount += 1;
      }

      if (this.sample.loopType === 2 && (loopCount & 1) == 1) {
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

class Instrument {
  constructor(instrumentIndex, ctx) {
    this.inst = song.getInstrument(instrumentIndex);
    this.instrumentIndex = instrumentIndex;
    this.ctx = ctx;
    this.samples = [];
    this.envelopes = {
      volume: undefined,
      panning: undefined,
    };

    // Build AudioBuffers from the sample data stored in the song
    if (this.inst.samples && this.inst.samples.length > 0) {
      for(var i = 0; i < this.inst.samples.length; i += 1) {
        let sample = {};
        if(this.inst.samples[i].len > 0 ) {
          let buflen = this.inst.samples[i].len;
          if(this.inst.samples[i].type & 2) {
            buflen += this.inst.samples[i].looplen;
          }
          const buf = ctx.createBuffer(1, buflen, ctx.sampleRate);
          let chan = buf.getChannelData(0);
          let loop = false;
          let loopType = 0;
          let loopStart = -1;
          let loopEnd = -1;
          try {
            // If pingpong loop, duplicate the loop section in reverse
            if (this.inst.samples[i].type & 2) {
              for(var s = 0; s < this.inst.samples[i].loop + this.inst.samples[i].looplen; s += 1) {
                chan[s] = this.inst.samples[i].sampledata.data[s];
              }
              // Duplicate loop section in reverse
              for (var t = s - 1; t >= this.inst.samples[i].loop; t--, s++) {
                chan[s] = this.inst.samples[i].sampledata.data[t];
              }
              loop = true;
              loopType = 2;
              loopStart = (buf.duration / buf.length) * this.inst.samples[i].loop;
              loopEnd = loopStart + ((buf.duration / buf.length) * ( this.inst.samples[i].looplen * 2));
            } else {
              for(var s = 0; s < this.inst.samples[0].len; s += 1) {
                chan[s] = this.inst.samples[i].sampledata.data[s];
              }
              if ((this.inst.samples[i].type & 3) == 1 && this.inst.samples[i].looplen !== 0) {
                loop = true;
                loopType = 1;
                loopStart = (buf.duration / buf.length) * this.inst.samples[i].loop;
                loopEnd = loopStart + ((buf.duration / buf.length) * this.inst.samples[i].looplen);
              }
            }
          } catch(e) {
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

  periodForNote(ch, note, fine) {
    const sampNote = this.inst.samples[this.inst.samplemap[Math.min(Math.max(note, 0), 95)]].note;
    return 1920 - (note + sampNote)*16 - fine / 8.0;
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
        this.inst.env_vol.loopend);
    }
    if (this.inst.env_pan) {
      this.envelopes.panning = new Envelope(
        this.inst.env_pan.points,
        this.inst.env_pan.type,
        this.inst.env_pan.sustain,
        this.inst.env_pan.loopstart,
        this.inst.env_pan.loopend);
    }
  }
}

class Track {
  constructor(ctx, destination) {
    this.ctx = ctx;
    this.filterstate = new Float32Array(3);
    this.vol = 0;
    this.pan = 128;
    this.period = 1920 - 48*16;
    this.vL = 0;
    this.vR = 0;   // left right volume envelope followers (changes per sample)
    this.vLprev = 0;
    this.vRprev = 0;
    this.stateStack = [{
      state: NORMAL,
      properties: {
        gain: 1,
      },
    }];
    this.volE = 0;
    this.panE = 0;
    this.retrig = 0;
    this.vibratopos = 0;
    this.vibratodepth = 1;
    this.vibratospeed = 1;
    this.vibratotype = 0;
    this.gainNode = this.ctx.createGain();
    this.analyser = this.ctx.createAnalyser();

    this.analyser.fftSize = 256;
    this.analyserBufferLength = this.analyser.frequencyBinCount;
    this.analyserScopeData = new Uint8Array(this.analyserBufferLength);

    this.gainNode.connect(this.analyser);
    this.analyser.connect(destination);
    this.gainNode.gain.value = 1.0;
  }

  updateAnalyserScopeData() {
    this.analyser.getByteTimeDomainData(this.analyserScopeData);
  }

  pushState(state) {
    if ('gain' in state.properties) {
      this.gainNode.gain.value = state.properties.gain; 
    } else {
      state.properties.gain = this.gainNode.gain.value;
    }
    this.stateStack.push(state);
  }

  popState() {
    const state = this.stateStack.pop();
    this.gainNode.gain.value = this.getState().properties.gain;
    return state;
  }

  getState() {
    if (this.stateStack.length > 0) {
      return this.stateStack[this.stateStack.length - 1];
    } else {
      return {
        state: NORMAL,
        properties: {
          gain: 1,
        },
      };
    }
  }
}

class Player {
  constructor() {
    this.tracks = [];
    this.instruments = [];

    // per-sample exponential moving average for volume changes (to prevent pops
    // and clicks); evaluated every 8 samples
    this.popfilter_alpha = 0.9837;

    this.cur_songpos = -1;
    this.cur_pat = undefined;
    this.cyclePattern = undefined;
    this.cur_row = 64;
    this.cur_ticksamp = 0;
    this.cur_tick = 0;
    this.globalVolume = this.max_global_volume = 128;
    this.masterVolume = undefined;
    this.speed = song.getSpeed();

    this.effects_t0 = [  // effect functions on tick 0
      this.eff_t1_0,  // 1, arpeggio is processed on all ticks
      this.eff_t0_1,
      this.eff_t0_2,
      this.eff_t0_3,
      this.eff_t0_4,  // 4
      this.eff_t0_a,  // 5, same as A on first tick
      this.eff_t0_a,  // 6, same as A on first tick
      this.eff_unimplemented_t0,  // 7
      this.eff_t0_8,  // 8
      this.eff_t0_9,  // 9
      this.eff_t0_a,  // a
      this.eff_t0_b,  // b
      this.eff_t0_c,  // c
      this.eff_t0_d,  // d
      this.eff_t0_e,  // e
      this.eff_t0_f,  // f
      this.eff_t0_g,  // g
      this.eff_t0_h,  // h
      this.eff_unimplemented_t0,  // i
      this.eff_unimplemented_t0,  // j
      this.eff_unimplemented_t0,  // k
      this.eff_unimplemented_t0,  // l
      this.eff_unimplemented_t0,  // m
      this.eff_unimplemented_t0,  // n
      this.eff_unimplemented_t0,  // o
      this.eff_unimplemented_t0,  // p
      this.eff_unimplemented_t0,  // q
      this.eff_t0_r,  // r
      this.eff_unimplemented_t0,  // s
      this.eff_unimplemented_t0,  // t
      this.eff_unimplemented_t0,  // u
      this.eff_unimplemented_t0,  // v
      this.eff_unimplemented_t0,  // w
      this.eff_unimplemented_t0,  // x
      this.eff_unimplemented_t0,  // y
      this.eff_unimplemented_t0,  // z
    ];

    this.effects_t1 = [  // effect functions on tick 1+
      this.eff_t1_0,
      this.eff_t1_1,
      this.eff_t1_2,
      this.eff_t1_3,
      this.eff_t1_4,
      this.eff_t1_5,  // 5
      this.eff_t1_6,  // 6
      this.eff_unimplemented,  // 7
      null,   // 8
      null,   // 9
      this.eff_t1_a,  // a
      null,   // b
      null,   // c
      null,   // d
      this.eff_t1_e,  // e
      null,   // f
      null,  // g
      this.eff_t1_h,  // h
      this.eff_unimplemented,  // i
      this.eff_unimplemented,  // j
      this.eff_unimplemented,  // k
      this.eff_unimplemented,  // l
      this.eff_unimplemented,  // m
      this.eff_unimplemented,  // n
      this.eff_unimplemented,  // o
      this.eff_unimplemented,  // p
      this.eff_unimplemented,  // q
      this.eff_t1_r,  // r
      this.eff_unimplemented,  // s
      this.eff_unimplemented,  // t
      this.eff_unimplemented,  // u
      this.eff_unimplemented,  // v
      this.eff_unimplemented,  // w
      this.eff_unimplemented,  // x
      this.eff_unimplemented,  // y
      this.eff_unimplemented   // z
    ];

    var audioContext = window.AudioContext || window.webkitAudioContext;
    this.audioctx = new audioContext();
    this.masterGain = this.audioctx.createGain();

    this.masterGain.connect(this.audioctx.destination);

    this.playing = false;
    this.lookahead = 25;
    this.scheduleAheadTime = 0.3;

    this.playingInteractive = false;
    this.interactiveLookahead = 10;
    this.interactiveScheduleAheadTime = 0.01;

    this.XMView = new XMViewObject(this);

    this.timerWorker = new TimerWorker();
    this.timerWorker.port.postMessage({"interval": this.lookahead});
    this.timerWorker.port.onmessage = this.onTimerMessage.bind(this);
    this.timerWorker.port.start();

    this.interactiveTimerWorker = new TimerWorker();
    this.interactiveTimerWorker.port.postMessage({"interval": this.interactiveLookahead});
    this.interactiveTimerWorker.port.onmessage = this.onInteractiveTimerMessage.bind(this);
    this.interactiveTimerWorker.port.start();

    this.playingInstruments = [];

    Signal.connect(song, 'songChanged', this, 'onSongChanged');
    Signal.connect(song, 'instrumentChanged', this, 'onInstrumentChanged');
    Signal.connect(song, 'instrumentListChanged', this, 'onInstrumentListChanged');
    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
    Signal.connect(state, "transportChanged", this, "onTransportChanged");
  }

  onTimerMessage(e) {
    if( e.data === "tick") {
      this.scheduler();
    }
  }

  onInteractiveTimerMessage(e) {
    if( e.data === "tick") {
      var msPerTick = 2.5 / this.bpm;
      while(this.nextInteractiveTickTime < (this.audioctx.currentTime + this.interactiveScheduleAheadTime)) {
        for (let i = 0; i < this.playingInstruments.length; i += 1) {
          this.playingInstruments[i].updateVolumeEnvelope(this.nextInteractiveTickTime, this.playingInstruments[i].release);
        }
        this.nextInteractiveTickTime += msPerTick;
      }
      this.XMView.pushEvent({
        t: this.nextInteractiveTickTime,
      });
    }
  }

  playNoteOnCurrentChannel(note, finished) {
    const channel = this.tracks[state.cursor.get("track")];
    const instrument = this.instruments[state.cursor.get("instrument")];
    const time = this.audioctx.currentTime;

    if(this.playingInstruments.length === 0) {
      this.nextInteractiveTickTime = this.audioctx.currentTime;
      this.interactiveTimerWorker.port.postMessage("start");
      this.XMView.start();
      this.playingInteractive = true;
    }

    // If any other instruments are still playing but have been released, stop them.
    for (let i = this.playingInstruments.length - 1; i >= 0; i -= 1) {
      if(this.playingInstruments[i].release) {
        this.playingInstruments[i].stop(time);
        this.playingInstruments.splice(i, 1);
      }
    }

    try {
      const samp = instrument.inst.samples[instrument.inst.samplemap[note]];
      channel.pan = samp.pan;
      channel.vol = samp.vol;
      channel.fine = samp.fine;
      const instr = instrument.playNoteOnChannel(channel, time, note, (instrument) => {
        const index = this.playingInstruments.indexOf(instrument);
        if (index !== -1) {
          this.playingInstruments.splice(index, 1);
          if(this.playingInstruments.length === 0) {
            this.interactiveTimerWorker.port.postMessage("stop");
            this.XMView.stop();
            this.playingInteractive = false;
          }
        }
        if (finished && typeof finished === 'function') {
          finished(instrument);
        }
      });
      instr.release = false;
      this.playingInstruments.push(instr);
      return instr;
    } catch(e) {
      return undefined;
    }
  }

  releaseInteractiveInstrument(playerInstrument) {
    const index = this.playingInstruments.indexOf(playerInstrument);
    if (index !== -1) {
      const time = this.audioctx.currentTime;
      playerInstrument.release = true;
    }
  }

  stopInteractiveInstrument(playerInstrument) {
    const time = this.audioctx.currentTime;
    playerInstrument.stop(time);
  }

  currentTime() {
    return this.audioctx.currentTime;
  }

  // Return 2-pole Butterworth lowpass filter coefficients for
  // center frequncy f_c (relative to sampling frequency)
  filterCoeffs(f_c) {
    if (f_c > 0.5) {  // we can't lowpass above the nyquist frequency...
      f_c = 0.5;
    }
    var wct = Math.sqrt(2) * Math.PI * f_c;
    var e = Math.exp(-wct);
    var c = e * Math.cos(wct);
    var gain = (1 - 2*c + e*e) / 2;
    return [gain, 2*c, -e*e];
  }

  updateChannelPeriod(ch, period) {
    var freq = 8363 * Math.pow(2, (1152.0 - period) / 192.0);
    if (isNaN(freq)) {
      console.log("invalid period!", period);
      return;
    }
    ch.doff = freq / this.f_smp;
    ch.filter = this.filterCoeffs(ch.doff / 2);
  }


  setCurrentPattern() {
    var nextPat = song.getSequencePatternNumber(this.cur_songpos);

    // check for out of range pattern index
    const maxpat = song.getNumPatterns();
    const maxseq = song.getSequenceLength();
    while (nextPat >= maxpat) {
      if ((this.cur_songpos + 1) < maxseq) {
        // first try skipping the position
        this.cur_songpos++;
      } else if ((this.cur_songpos === song.getLoopPosition() && this.cur_songpos !== 0)
        || song.getLoopPosition() >= maxseq) {
        // if we allready tried song_looppos or if song_looppos
        // is out of range, go to the first position
        this.cur_songpos = 0;
      } else {
        // try going to song_looppos
        this.cur_songpos = song.getLoopPosition();
      }
      nextPat = song.getSequencePatternNumber(this.cur_songpos);
    }

    this.cur_pat = nextPat;
  }

  processRow() {
    if (this.cur_pat == null || this.cur_row >= song.getPatternRowCount(this.cur_pat)) {
      if (this.cyclePattern != null) {
        this.cur_pat = this.cyclePattern;
        this.cur_row = 0;
      } else {
        this.cur_row = 0;
        this.cur_songpos++;
        if (this.cur_songpos >= song.getSequenceLength()) {
          this.cur_songpos = song.getLoopPosition();
        }
        this.setCurrentPattern();
      }
    }
    const numrows = song.getPatternRowCount(this.cur_pat);
    if(this.cur_row < numrows) {
      const numtracks = song.getNumTracks();
      for (let trackindex = 0; trackindex < numtracks; trackindex += 1) {
        let track = song.getTrackDataForPatternRow(this.cur_pat, this.cur_row, trackindex);
        var ch = this.tracks[trackindex];
        var inst = ch.inst;
        ch.triggernote = false;
        var event = {};
        if ("notedata" in track && track.notedata.length > 0) {
          event = track.notedata[0];
        }

        // instrument trigger
        if (event.instrument && event.instrument !== -1) {
          inst = this.instruments[event.instrument - 1];
          if (inst && inst.inst && inst.inst.samplemap) {
            ch.inst = inst;
            // reset properties, but let the same instrument and note keep playing.
            // note: it doesn't matter what the instrument number is, it just retriggers the
            // properties of the currently playing instrument. Only if you specify a note AND
            // instrument does it change the playing instrument.
            if (ch.note && inst.inst.samplemap) {
              const samp = inst.inst.samples[inst.inst.samplemap[ch.note]];
              ch.vol = samp.vol;
              ch.pan = samp.pan;
              ch.fine = samp.fine;
              if(ch.currentlyPlaying) {
                ch.currentlyPlaying.resetEnvelopes();
              }
            }
          }
        }

        // note trigger
        if ("note" in event && event.note != -1) {
          if (event.note == 96) {
            ch.release = 1;
            ch.triggernote = false;
          } else {
            if (inst && inst.inst && inst.inst.samplemap) {
              var note = event.note;
              ch.note = note;
              //if (ch.triggernote) {
                // if we were already triggering the note, reset vol/pan using
                // (potentially) new sample
                const samp = inst.inst.samples[inst.inst.samplemap[note]];
                ch.pan = samp.pan;
                ch.vol = samp.vol;
                ch.fine = samp.fine;
              //}
              ch.triggernote = true;
            }
            ch.triggernote = true;
          }
        }

        ch.voleffectfn = undefined;
        if ("volume" in event && event.volume != -1) {  // volume column
          var v = event.volume;
          ch.voleffectdata = v & 0x0f;
          if (v < 0x10) {
            if (v !== 0) {
              console.log("Track", trackindex, "invalid volume", event.volume.toString(16));
            }
          } else if (v <= 0x50) {
            ch.vol = v - 0x10;
          } else if (v >= 0x60 && v < 0x70) {  // volume slide down
            ch.voleffectfn = function(ch) {
              ch.vol = Math.max(0, ch.vol - ch.voleffectdata);
            };
          } else if (v >= 0x70 && v < 0x80) {  // volume slide up
            ch.voleffectfn = function(ch) {
              ch.vol = Math.min(64, ch.vol + ch.voleffectdata);
            };
          } else if (v >= 0x80 && v < 0x90) {  // fine volume slide down
            ch.vol = Math.max(0, ch.vol - (v & 0x0f));
          } else if (v >= 0x90 && v < 0xa0) {  // fine volume slide up
            ch.vol = Math.min(64, ch.vol + (v & 0x0f));
          } else if (v >= 0xa0 && v < 0xb0) {  // vibrato speed
            ch.vibratospeed = v & 0x0f;
          } else if (v >= 0xb0 && v < 0xc0) {  // vibrato w/ depth
            ch.vibratodepth = v & 0x0f;
            ch.voleffectfn = this.effects_t1[4];  // use vibrato effect directly
            var tempeffectfn = this.effects_t1[4];
            if(tempeffectfn) tempeffectfn.bind(this)(ch);  // and also call it on tick 0
          } else if (v >= 0xc0 && v < 0xd0) {  // set panning
            ch.pan = (v & 0x0f) * 0x11;
          } else if (v >= 0xf0 && v <= 0xff) {  // portamento
            if (v & 0x0f) {
              ch.portaspeed = (v & 0x0f) << 4;
            }
            ch.voleffectfn = this.effects_t1[3].bind(this);  // just run 3x0
          } else {
            console.log("Track", trackindex, "volume effect", v.toString(16));
          }
        }

        ch.effectfn = undefined;
        if("fxtype" in event && event.fxtype != -1) {
          try {
            ch.effect = event.fxtype;
            ch.effectdata = event.fxparam;
            if (ch.effect < 36) {
              ch.effectfn = this.effects_t1[ch.effect];
              var eff_t0 = this.effects_t0[ch.effect];
              if (eff_t0 && eff_t0.bind(this)(ch, ch.effectdata)) {
                ch.triggernote = false;
              }
              // If effect B or D, jump or pattern break, don't process any more columns.
              if (ch.effect === 0xb || ch.effect === 0xd ) {
                return;
              }
            } else {
              console.log("Track", trackindex, "effect > 36", ch.effect);
            }

            // special handling for portamentos: don't trigger the note
            if (ch.effect == 3 || ch.effect == 5 || event.volume >= 0xf0) {
              if (event.note != -1) {
                ch.periodtarget = ch.inst.periodForNote(ch, ch.note, ch.fine);
              }
              ch.triggernote = false;
              if (inst && inst.inst && inst.inst.samplemap) {
                if (ch.currentlyPlaying == null) {
                  // note wasn't already playing; we basically have to ignore the
                  // portamento and just trigger
                  ch.triggernote = true;
                } else if (ch.release) {
                  // reset envelopes if note was released but leave offset/pitch/etc
                  // alone
                  ch.envtick = 0;
                  ch.release = 0;
                }
              }
            }
          } catch(e) {
            console.log(e);
          }
        }

        if (ch.triggernote) {
          // there's gotta be a less hacky way to handle offset commands...
          if (ch.effect != 9) ch.off = 0;
          ch.release = 0;
          ch.envtick = 0;
          if (ch.note) {
            ch.period = ch.inst.periodForNote(ch, ch.note, ch.fine);
          }
          // waveforms 0-3 are retriggered on new notes while 4-7 are continuous
          if (ch.vibratotype < 4) {
            ch.vibratopos = 0;
          }
        }
      }
    }
    this.cur_row++;
  }


  processTick() {
    if(!this.playing) {
      return;
    }
    if(this.audioctx.currentTime > this.nextTickTime) {
      console.log("Lag!!!");
    }
    var j, ch;
    for (j in this.tracks) {
      ch = this.tracks[j];
      ch.periodoffset = 0;
    }
    if (this.cur_tick >= this.speed) {
      this.cur_tick = 0;
    }

    if (this.cur_tick === 0) {
      this.processRow();
    }

    for (j = 0; j < this.tracks.length; j += 1) {
      ch = this.tracks[j];
      var inst = ch.inst;
      if (this.cur_tick !== 0) {
        if(ch.voleffectfn) ch.voleffectfn.bind(this)(ch);
        if(ch.effectfn) ch.effectfn.bind(this)(ch);
      }
      if (isNaN(ch.period)) {
        throw "NaN Period";
      }
      if (inst === undefined)
        continue;

      if (ch.triggernote) {
        if(ch.currentlyPlaying) {
          ch.currentlyPlaying.stop(this.nextTickTime);
        }
        ch.currentlyPlaying = ch.inst.playNoteOnChannel(ch, this.nextTickTime, ch.note);
        ch.triggernote = false;
      }
      if(ch.currentlyPlaying) {
        ch.currentlyPlaying.updateVolumeEnvelope(this.nextTickTime, ch.release);
        ch.currentlyPlaying.updateChannelPeriod(this.nextTickTime, ch.period + ch.periodoffset);
      }
    }
    this.XMView.pushEvent({
      t: this.nextTickTime,
      songpos: this.cur_songpos,
      pat: this.cur_pat,
      row: this.cur_row
    });
    this.cur_tick++;
  }

  scheduler() {
    var msPerTick = 2.5 / this.bpm;
    while(this.nextTickTime < (this.audioctx.currentTime + this.scheduleAheadTime)) {
      this.processTick();
      this.nextTickTime += msPerTick;
    }
  }

  playPattern(pattern) {
    this.cyclePattern = pattern;
    this.cur_pat = pattern;
    this.cur_row = -1;

    state.set({
      cursor: {
        pattern: pattern,
        row: 0,
      },
    });

    this._play();
  }

  play() {
    this.cyclePattern = null;
    this._play();
  }

  toggleMuteTrack(index) {
    if (index < this.tracks.length) {
      const currentState = this.tracks[index].getState();
      if (currentState.state === MUTE) {
        this.tracks[index].popState();
      } else if ([SILENT, SOLO].indexOf(currentState.state) === -1) {
        this.tracks[index].pushState({
          state: MUTE,
          properties: {
            gain: 0,
          }
        });
        this.tracks[index].gainNode.gain.value = 0;
      }
      this.XMView.pushEvent({
        t: this.audioctx.currentTime,
      });
    }
  }

  toggleSoloTrack(index) {
    if (index < this.tracks.length) {
      const currentState = this.tracks[index].getState();
      if (currentState.state === SOLO) {
        for (let t = 0; t < this.tracks.length; t += 1) {
          this.tracks[t].popState();
        }
      } else {
        for (let t = 0; t < this.tracks.length; t += 1) {
          this.tracks[t].popState();
          if (t === index) {
            this.tracks[t].pushState({
              state: SOLO,
              properties: {
                gain: this.tracks[t].gainNode.gain.value,
              }
            });
          } else {
            this.tracks[t].pushState({
              state: SILENT,
              properties: {
                gain: this.tracks[t].gainNode.gain.value,
              }
            });
            this.tracks[t].gainNode.gain.value = 0;
          }
        }
      }
      this.XMView.pushEvent({
        t: this.audioctx.currentTime,
      });
    }
  }

  _play() {
    if (!this.playing) {
      // put paused events back into action, if any
      if (this.XMView.resume) this.XMView.resume();
      // start playing
      this.nextTickTime = this.audioctx.currentTime;

      this.timerWorker.port.postMessage("start");
    }
    this.playing = true;
  }

  pause() {
    if (this.playing) {
      if (this.XMView.pause) this.XMView.pause();
    }
    this.playing = false;

    this.timerWorker.port.postMessage("stop");
  }

  stop() {
    if (this.playing) {
      if (this.XMView.stop) this.XMView.stop();
    }
    this.playing = false;

    this.timerWorker.port.postMessage("stop");

    for(let i = 0; i < this.tracks.length; i += 1) {
      if(this.tracks[i].currentlyPlaying) {
        this.tracks[i].currentlyPlaying.stop(this.audioctx.currentTime);
        this.tracks[i].currentlyPlaying = undefined;
      }
    }

    for(let i = this.playingInstruments.length - 1; i >= 0; i -= 1) {
      this.playingInstruments[i].stop(this.audioctx.currentTime);
      this.playingInstruments.splice(i, 1);
    }

    this.reset();
  }

  setMasterVolume(dB) {
    let gain = Math.pow(10, dB/20);
    this.masterGain.gain.value = gain;
  }

  reset() {
    this.cur_pat = song.getSequencePatternNumber(0);
    this.cur_row = 0;
    this.cur_songpos = 0;
    this.cur_ticksamp = 0;
    this.cur_tick = 0;
    this.speed = song.getSpeed();
    this.bpm  = song.getBpm();

    state.set({
      cursor: {
        sequence: this.cur_songpos,
        pattern: this.cur_pat,
        row: this.cur_row,
      },
    });

    this.globalVolume = this.max_global_volume;
  }

  onSongChanged() {
    this.cur_pat = undefined;
    this.cur_row = 0;
    this.cur_songpos = 0;
    this.cur_ticksamp = 0;
    this.cur_tick = 0;
    this.playing = false;
    this.globalVolume = this.max_global_volume;

    this.reset();

    console.log("Song changed");

    this.tracks = [];

    // Initialise the channelinfo for each track.
    const numtracks = song.getNumTracks();
    for (let i = 0; i < numtracks; i += 1) {
      var trackinfo = new Track(this.audioctx, this.masterGain);
      this.tracks.push(trackinfo);
    }

    this.instruments = [];
    const numinstruments = song.getNumInstruments();
    // Initialise the instrument envelope objects
    for (let i = 0; i < numinstruments; i += 1) {
      this.instruments.push(new Instrument(i, this.audioctx));
    }

    this.XMView.pushEvent({
      t: this.audioctx.currentTime,
    });
  }

  onInstrumentChanged(instrumentIndex) {
    try {
      this.instruments[instrumentIndex] = new Instrument(instrumentIndex, this.audioctx);
    } catch(e) {
      console.log(e);
    }
  }

  onInstrumentListChanged() {
    this.instruments = [];
    // Initialise the instrument envelope objects
    const numinstruments = song.getNumInstruments();
    for (let i = 0; i < numinstruments; i += 1) {
      this.instruments.push(new Instrument(i, this.audioctx));
    }
  }

  onCursorChanged() {
    /*if (!this.playing && state.cursor.get("sequence") != this.cur_songpos) {
      this.cur_songpos = state.cursor.get("sequence");
    }*/
  }

  onTransportChanged() {
    if (this.masterVolume !== state.transport.get("masterVolume")) {
      this.masterVolume = state.transport.get("masterVolume");
      this.setMasterVolume(state.transport.get("masterVolume"));
    }
  }

  /* Load a local sound file using the player specific knowledge of formats
   */
  loadSampleFromFile(file, callback) {
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = (e) => {
      try {
        var contents = e.target.result;
        this.audioctx.decodeAudioData(e.target.result, (data) => {
          const floatData = data.getChannelData(0);
          if (callback) {
            callback(data, floatData);
          }
        });
      } catch(e) {
        console.log(e);
      }
    };
    reader.readAsArrayBuffer(file);
  }


  eff_t1_0(ch) {  // arpeggio
    if (ch.effectdata !== 0 && ch.inst !== undefined) {
      var arpeggio = [0, ch.effectdata>>4, ch.effectdata&15];
      var note = ch.note + arpeggio[this.cur_tick % 3];
      ch.period = ch.inst.periodForNote(ch, note, ch.fine);
    }
  }

  eff_t0_1(ch, data) {  // pitch slide up
    if (data !== 0) {
      ch.slideupspeed = data;
    }
  }

  eff_t1_1(ch) {  // pitch slide up
    if (ch.slideupspeed !== undefined) {
      // is this limited? it appears not
      ch.period -= ch.slideupspeed;
    }
  }

  eff_t0_2(ch, data) {  // pitch slide down
    if (data !== 0) {
      ch.slidedownspeed = data;
    }
  }

  eff_t1_2(ch) {  // pitch slide down
    if (ch.slidedownspeed !== undefined) {
      // 1728 is the period for C-1
      ch.period = Math.min(1728, ch.period + ch.slidedownspeed);
    }
  }

  eff_t0_3(ch, data) {  // portamento
    if (data !== 0) {
      ch.portaspeed = data;
    }
  }

  eff_t1_3(ch) {  // portamento
    if (ch.periodtarget !== undefined && ch.portaspeed !== undefined) {
      if (ch.period > ch.periodtarget) {
        ch.period = Math.max(ch.periodtarget, ch.period - ch.portaspeed);
      } else {
        ch.period = Math.min(ch.periodtarget, ch.period + ch.portaspeed);
      }
    }
  }

  eff_t0_4(ch, data) {  // vibrato
    if (data & 0x0f) {
      ch.vibratodepth = (data & 0x0f) * 2;
    }
    if (data >> 4) {
      ch.vibratospeed = data >> 4;
    }
    this.eff_t1_4(ch);
  }

  eff_t1_4(ch) {  // vibrato
    ch.periodoffset = this.getVibratoDelta(ch.vibratotype, ch.vibratopos) * ch.vibratodepth;
    if (isNaN(ch.periodoffset)) {
      console.log("vibrato periodoffset NaN?",
          ch.vibratopos, ch.vibratospeed, ch.vibratodepth);
      ch.periodoffset = 0;
    }
    // only updates on non-first ticks
    if (this.cur_tick > 0) {
      ch.vibratopos += ch.vibratospeed;
      ch.vibratopos &= 63;
    }
  }

  getVibratoDelta(type, x) {
    var delta = 0;
    switch (type & 0x03) {
      case 1: // sawtooth (ramp-down)
        delta = ((1 + x * 2 / 64) % 2) - 1;
        break;
      case 2: // square
      case 3: // random (in FT2 these two are the same)
        delta = x < 32 ? 1 : -1;
        break;
      case 0:
      default: // sine
        delta = Math.sin(x * Math.PI / 32);
        break;
    }
    return delta;
  }

  eff_t1_5(ch) {  // portamento + volume slide
    this.eff_t1_a(ch);
    this.eff_t1_3(ch);
  }

  eff_t1_6(ch) {  // vibrato + volume slide
    this.eff_t1_a(ch);
    this.eff_t1_4(ch);
  }

  eff_t0_8(ch, data) {  // set panning
    ch.pan = data;
  }

  eff_t0_9(ch, data) {  // sample offset
    ch.off = data * 256;
  }

  eff_t0_a(ch, data) {  // volume slide
    if (data) {
      ch.volumeslide = -(data & 0x0f) + (data >> 4);
    }
  }

  eff_t1_a(ch) {  // volume slide
    // TODO: Can we do a linearRampToValueAtTime to take the load of tick processing
    // away here?
    if (ch.volumeslide !== undefined) {
      ch.vol = Math.max(0, Math.min(64, ch.vol + ch.volumeslide));
    }
  }

  eff_t0_b(ch, data) {  // song jump (untested)
    if (data < song.getSequenceLength()) {
      this.cur_songpos = data;
      this.setCurrentPattern();
      this.cur_row = 0;
    }
  }

  eff_t0_c(ch, data) {  // set volume
    ch.vol = Math.min(64, data);
  }

  eff_t0_d(ch, data) {  // pattern jump
    this.cur_songpos++;
    if (this.cur_songpos >= song.getSequenceLength())
      this.cur_songpos = song.getLoopPosition();
    this.cur_pat = song.getSequencePatternNumber(this.cur_songpos);
    this.cur_row = (data >> 4) * 10 + (data & 0x0f);
  }

  eff_t0_e(ch, data) {  // extended effects!
    var eff = data >> 4;
    data = data & 0x0f;
    switch (eff) {
      case 1:  // fine porta up
        ch.period -= data;
        break;
      case 2:  // fine porta down
        ch.period += data;
        break;
      case 4:  // set vibrato waveform
        ch.vibratotype = data & 0x07;
        break;
      case 5:  // finetune
        ch.fine = (data<<4) + data - 128;
        break;
      case 8:  // panning
        ch.pan = data * 0x11;
        break;
      case 0x0a:  // fine vol slide up (with memory)
        if (data === 0 && ch.finevolup !== undefined)
          data = ch.finevolup;
        ch.vol = Math.min(64, ch.vol + data);
        ch.finevolup = data;
        break;
      case 0x0b:  // fine vol slide down
        if (data === 0 && ch.finevoldown !== undefined)
          data = ch.finevoldown;
        ch.vol = Math.max(0, ch.vol - data);
        ch.finevoldown = data;
        break;
      case 0x0c:  // note cut handled in eff_t1_e
        break;
      default:
        throw `Unimplemented extended effect E ${ch.effectdata.toString(16)}`;
        break;
    }
  }

  eff_t1_e(ch) {  // note cut
    switch (ch.effectdata >> 4) {
      case 0x0c:
        if (this.cur_tick == (ch.effectdata & 0x0f)) {
          ch.vol = 0;
        }
        break;
    }
  }

  eff_t0_f(ch, data) {  // set tempo
    if (data === 0) {
      console.log("tempo 0?");
      return;
    } else if (data < 0x20) {
      this.speed = data;
    } else {
      this.bpm = data;
    }
    state.set({
      transport: {
        bpm: this.bpm,
        speed: this.speed,
      },
    });
  }

  eff_t0_g(ch, data) {  // set global volume
    if (data <= 0x40) {
      // volume gets multiplied by 2 to match
      // the initial max global volume of 128
      this.globalVolume = Math.max(0, data * 2);
    } else {
      this.globalVolume = this.max_global_volume;
    }
  }

  eff_t0_h(ch, data) {  // global volume slide
    if (data) {
      // same as Axy but multiplied by 2
      this.globalVolumeslide = (-(data & 0x0f) + (data >> 4)) * 2;
    }
  }

  eff_t1_h(ch) {  // global volume slide
    if (this.globalVolumeslide !== undefined) {
      this.globalVolume = Math.max(0, Math.min(this.max_global_volume,
        this.globalVolume + this.globalVolumeslide));
    }
  }

  eff_t0_r(ch, data) {  // retrigger
    if (data & 0x0f) ch.retrig = (ch.retrig & 0xf0) + (data & 0x0f);
    if (data & 0xf0) ch.retrig = (ch.retrig & 0x0f) + (data & 0xf0);

    // retrigger volume table
    switch (ch.retrig >> 4) {
      case 1: ch.vol -= 1; break;
      case 2: ch.vol -= 2; break;
      case 3: ch.vol -= 4; break;
      case 4: ch.vol -= 8; break;
      case 5: ch.vol -= 16; break;
      case 6: ch.vol *= 2; ch.vol /= 3; break;
      case 7: ch.vol /= 2; break;
      case 9: ch.vol += 1; break;
      case 0x0a: ch.vol += 2; break;
      case 0x0b: ch.vol += 4; break;
      case 0x0c: ch.vol += 8; break;
      case 0x0d: ch.vol += 16; break;
      case 0x0e: ch.vol *= 3; ch.vol /= 2; break;
      case 0x0f: ch.vol *= 2; break;
    }
    ch.vol = Math.min(64, Math.max(0, ch.vol));
  }

  eff_t1_r(ch) {
    if (this.cur_tick % (ch.retrig & 0x0f) === 0) {
      ch.off = 0;
    }
  }

  eff_unimplemented() {}
  eff_unimplemented_t0(ch, data) {
    throw `Unimplemented effect ${ch.effect} ${data}`;
  }
}

export let player = new Player();
