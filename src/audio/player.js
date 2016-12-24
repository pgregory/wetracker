import Signal from '../utils/signal';

import { state } from '../state';
import { song } from '../utils/songmanager';
import Envelope from './envelope';

import TimerWorker from 'shared-worker!./timerworker';

class EnvelopeFollower {
  constructor(env) {
    this.env = env;
    this.tick = 0;
  }

  Tick(release) {
    if(this.env != null) {
      var value = this.env.Get(this.tick);

      // if we're sustaining a note, stop advancing the tick counter
      if (!release && this.tick >= this.env.points[this.env.sustain*2]) {
        return this.env.points[this.env.sustain*2 + 1];
      }

      // TODO: Need to take into account vol_fadeout when releasing.
      this.tick++;
      if (this.env.type & 4) {  // envelope loop?
        if (!release &&
            this.tick >= this.env.loopend) {
          this.tick -= this.env.loopend - this.env.loopstart;
        }
      }
      return value;
    }
    return 64.0;
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

  pushEvent(e) {
    this.audio_events.push(e);
    if(this.audio_events.length == 1) {
      window.requestAnimationFrame(this.redrawScreen);
    }
  }

  redrawScreen() {
    var e;
    var t = this.player.audioctx.currentTime;
    while (this.audio_events.length > 0 && this.audio_events[0].t < t) {
      e = this.audio_events.shift();
    }
    if (!e) {
      if (this.player.playing) {
        window.requestAnimationFrame(this.redrawScreen);
      }
      return;
    }
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
    const scopes = [];
    const states = [];

    for (let j = 0; j < song.song.tracks.length; j += 1) {
      const ch = this.player.tracks[j];
      ch.updateAnalyserScopeData();
      scopes.push({
        scopeData: ch.analyserScopeData,
        bufferLength: ch.analyserBufferLength,
      });

      states.push({
        mute: ch.mute,
      });
    }
    state.set({
      tracks: {
        t: e.t,
        vu: e.vu,
        scopes,
        states,
      }
    });
    if(this.player.playing) {
      window.requestAnimationFrame(this.redrawScreen);
    }
  }
}

class PlayerInstrument {
  constructor(instrument, channel, note, time) {
    this.channel = channel;
    this.instrument = instrument;
    this.sourceNode = instrument.ctx.createBufferSource();
    this.gainNode = instrument.ctx.createGain();
    this.panningNode = instrument.ctx.createStereoPanner();
    this.gainNode.connect(this.panningNode);
    this.panningNode.connect(channel.gainNode);
    const period = instrument.periodForNote(channel, note, 0);
    const rate = this.rateForPeriod(period);
    this.sourceNode.playbackRate.value = rate;
    this.sourceNode.connect(this.gainNode);
    const sample = instrument.samples[instrument.inst.samplemap[note]];
    this.sourceNode.buffer = sample.buffer;
    this.sourceNode.loop = sample.loop;
    this.sourceNode.loopStart = sample.loopStart;
    this.sourceNode.loopEnd = sample.loopEnd;
    this.volumeEnvelope = new EnvelopeFollower(instrument.envelopes.volume);
    this.panningEnvelope = new EnvelopeFollower(instrument.envelopes.panning);
    this.sourceNode.onended = () => this.onEnded();

    let offset = 0;
    if (channel.off != null && channel.off > 0) {
      offset = (sample.buffer.duration / sample.buffer.length) * channel.off;
    }
    this.sourceNode.start(time, offset);
  }

  updateVolumeEnvelope(time, release) {
    let volE = this.volumeEnvelope.Tick(release) / 64.0;
    let panE = 4*(this.panningEnvelope.Tick(release) - 32);

    let pan = (panE + (this.channel.pan - 128)) / 256.0;  // final pan
    let vol = song.song.globalVolume * volE * this.channel.vol / (128 * 64);

    this.gainNode.gain.setValueAtTime(vol, time);
    this.panningNode.pan.setValueAtTime(pan, time);
  }

  stop(time) {
    this.sourceNode.stop(time);
  }

  onEnded() {
    this.gainNode.disconnect();
    this.sourceNode.disconnect();
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

}

class Instrument {
  constructor(inst, ctx) {
    this.inst = inst; // A reference to the instrument in the song
    this.ctx = ctx;
    this.samples = [];
    this.envelopes = {
      volume: undefined,
      panning: undefined,
    };

    // Build AudioBuffers from the sample data stored in the song
    if (inst.samples && inst.samples.length > 0) {
      for(var i = 0; i < inst.samples.length; i += 1) {
        let sample = {};
        if(inst.samples[i].len > 0 ) {
          let buflen = inst.samples[i].len;
          if(inst.samples[i].type & 2) {
            buflen = inst.samples[i].loop + inst.samples[i].looplen;
          }
          const buf = ctx.createBuffer(1, buflen, ctx.sampleRate);
          let chan = buf.getChannelData(0);
          let loop = false;
          let loopStart = -1;
          let loopEnd = -1;
          try {
            // If pingpong loop, duplicate the loop section in reverse
            if (inst.samples[i].type & 2) {
              for(var s = 0; s < inst.samples[i].loop; s += 1) {
                chan[s] = inst.samples[i].sampledata[s];
              }
              // Duplicate loop section in reverse
              for (s = inst.samples[i].looplen - 1; s >= 0; s--) {
                chan[s + inst.samples[i].loop] = inst.samples[i].sampledata[inst.samples[i].loop + s];
              }
              loop = true;
              loopStart = (buf.duration / buf.length) * inst.samples[i].loop;
              loopEnd = loopStart + ((buf.duration / buf.length) * ( inst.samples[i].looplen * 2));
            } else {
              for(var s = 0; s < inst.samples[0].len; s += 1) {
                chan[s] = inst.samples[i].sampledata[s];
              }
              if ((inst.samples[i].type & 3) == 1 && inst.samples[i].looplen !== 0) {
                loop = true;
                loopStart = (buf.duration / buf.length) * inst.samples[i].loop;
                loopEnd = loopStart + ((buf.duration / buf.length) * inst.samples[i].looplen);
              }
            }
          } catch(e) {
            console.log(e);
          }
          sample = {
            buffer: buf,
            loop,
            loopStart,
            loopEnd,
          };
        }
        this.samples.push(sample);
      }
    }
    this.refreshEnvelopeData();
  }

  playNoteOnChannel(channel, time, note) {
    if (this.samples[this.inst.samplemap[note]].buffer) {
      return new PlayerInstrument(this, channel, note, time);
    }
    return null;
  }

  periodForNote(ch, note, fine) {
    const sampNote = this.inst.samples[this.inst.samplemap[note]].note;
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
        this.inst.env_vol.loop_end);
    }
    if (this.inst.env_pan) {
      this.envelopes.panning = new Envelope(
        this.inst.env_pan.points,
        this.inst.env_pan.type,
        this.inst.env_pan.sustain,
        this.inst.env_pan.loopstart,
        this.inst.env_pan.loop_end);
    }
    console.log(this.envelopes.volume);
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
    this.mute = 0;
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
    song.song.globalVolume = this.max_global_volume = 128;

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
    this.gainNode = this.audioctx.createGain();
    this.gainNode.gain.value = 0.5;  // master volume

    this.gainNode.connect(this.audioctx.destination);

    this.playing = false;
    this.lookahead = 25;
    this.scheduleAheadTime = 0.3;

    this.XMView = new XMViewObject(this);

    this.timerWorker = new TimerWorker();
    this.timerWorker.port.postMessage({"interval": this.lookahead});
    this.timerWorker.port.onmessage = this.onTimerMessage.bind(this);
    this.timerWorker.port.start();

    this.interactiveTimerWorker = new TimerWorker();
    this.interactiveTimerWorker.port.postMessage({"interval": this.lookahead});
    this.interactiveTimerWorker.port.onmessage = this.onInteractiveTimerMessage.bind(this);
    this.interactiveTimerWorker.port.start();

    this.playingInstruments = [];

    Signal.connect(song, 'songChanged', this, 'onSongChanged');
    Signal.connect(song, 'instrumentChanged', this, 'onInstrumentChanged');
    Signal.connect(song, 'instrumentListChanged', this, 'onInstrumentListChanged');
    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
  }

  onTimerMessage(e) {
    if( e.data === "tick") {
      this.scheduler();
    } else {
      console.log("Timer message: " + e.data);
    }
  }

  onInteractiveTimerMessage(e) {
    if( e.data === "tick") {
      var msPerTick = 2.5 / song.song.bpm;
      while(this.nextInteractiveTickTime < (this.audioctx.currentTime + this.scheduleAheadTime)) {
        for (let i = 0; i < this.playingInstruments.length; i += 1) {
          this.playingInstruments[i].updateVolumeEnvelope(this.nextInteractiveTickTime, this.playingInstruments[i].release);
        }
        this.nextInteractiveTickTime += msPerTick; 
      }
    } else {
      console.log("Timer message: " + e.data);
    }
  }

  playNoteOnCurrentChannel(note) {
    const channel = this.tracks[state.cursor.get("track")];
    const instrument = this.instruments[state.cursor.get("instrument")];
    const time = this.audioctx.currentTime;

    if(this.playingInstruments.length === 0) {
      this.nextInteractiveTickTime = this.audioctx.currentTime;
      this.interactiveTimerWorker.port.postMessage("start");
    }

    // If any other instruments are still playing but have been released, stop them.
    for (let i = this.playingInstruments.length - 1; i >= 0; i -= 1) {
      if(this.playingInstruments[i].release) {
        this.playingInstruments[i].stop(time);
        this.playingInstruments.splice(i, 1);
      }
    }
    
    const samp = instrument.inst.samples[instrument.inst.samplemap[note]];
    channel.pan = samp.pan;
    channel.vol = samp.vol;
    channel.fine = samp.fine;
    const instr = instrument.playNoteOnChannel(channel, time, note);
    instr.release = false;
    this.playingInstruments.push(instr);
    return instr;
  }

  releaseInteractiveInstrument(playerInstrument) {
    const index = this.playingInstruments.indexOf(playerInstrument);
    if (index !== -1) {
      const time = this.audioctx.currentTime;
      playerInstrument.release = true;
    }
  }

  stopInteractiveInstrument(playerInstrument) {
    const index = this.playingInstruments.indexOf(playerInstrument);
    if (index !== -1) {
      const time = this.audioctx.currentTime;
      playerInstrument.stop(time);
      console.log(this.playingInstruments.length);
      this.playingInstruments.splice(index, 1);
      console.log(this.playingInstruments.length);
      if(this.playingInstruments.length === 0) {
        this.interactiveTimerWorker.port.postMessage("stop");
      }
    }
  }

  currentTime() {
    return this.audioctx.currentTime;
  }

  prettify_note(note) {
    if (note < 0) return "---";
    if (note == 96) return "^^^";
    return this._note_names[note%12] + ~~(note/12);
  }

  prettify_number(num) {
    if (num == -1) return "--";
    if (num < 10) return "0" + num;
    return num;
  }

  prettify_volume(num) {
    if (num < 0x10) return "--";
    return num.toString(16);
  }

  prettify_effect(t, p) {
    if (t >= 10) t = String.fromCharCode(55 + t);
    if (p < 16) p = '0' + p.toString(16);
    else p = p.toString(16);
    return t + p;
  }

  prettify_notedata(data) {
    return (this.prettify_note(data[0]) + " " + this.prettify_number(data[1]) + " " +
        this.prettify_volume(data[2]) + " " +
        this.prettify_effect(data[3], data[4]));
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
    var nextPat = song.song.sequence[this.cur_songpos].pattern;

    // check for out of range pattern index
    while (nextPat >= song.song.patterns.length) {
      if (this.cur_songpos + 1 < song.song.sequence.length) {
        // first try skipping the position
        this.cur_songpos++;
      } else if ((this.cur_songpos === song.song.loopPosition && this.cur_songpos !== 0)
        || song.song.loopPosition >= song.song.sequence.length) {
        // if we allready tried song_looppos or if song_looppos
        // is out of range, go to the first position
        this.cur_songpos = 0;
      } else {
        // try going to song_looppos
        this.cur_songpos = song.song.loopPosition;
      }
      nextPat = song.song.sequence[this.cur_songpos].pattern;
    }

    this.cur_pat = nextPat;
  }

  processRow() {
    if (this.cur_pat == null || this.cur_row >= song.song.patterns[this.cur_pat].numrows) {
      if (this.cyclePattern != null) {
        this.cur_pat = this.cyclePattern;
        this.cur_row = 0;
      } else {
        this.cur_row = 0;
        this.cur_songpos++;
        if (this.cur_songpos >= song.song.sequence.length) {
          this.cur_songpos = song.song.loopPosition;
        }
        this.setCurrentPattern();
      }
    }
    var pattern = song.song.patterns[this.cur_pat];
    if(this.cur_row < pattern.rows.length) {
      var row = pattern.rows[this.cur_row];
      for (var trackindex = 0; trackindex < song.song.tracks.length; trackindex += 1) {
        var track = {
          notedata: [
            {
              notes: -1,
              instrument: -1,
              volumne: -1,
              fxtype: -1,
              fxparam: -1,
            }
          ]
        };
        if(row && trackindex < row.length && row[trackindex] != null) {
          track = row[trackindex];
        }
        var trackinfo = song.song.tracks[trackindex];
        if (trackinfo) {
          var ch = this.tracks[trackindex];
          var inst = ch.inst;
          ch.triggernote = false;
          var event = {};
          if ("notedata" in track && track.notedata.length > 0) {
            event = track.notedata[0];
          }
          // instrument trigger
          if ("note" in event && event.note !== -1 && event.instrument && event.instrument !== -1) {
            inst = this.instruments[event.instrument - 1];
            if (inst && inst.inst && inst.inst.samplemap) {
              ch.inst = inst;
              // retrigger unless overridden below
              ch.triggernote = true;
              if (ch.note && inst.inst.samplemap) {
                const samp = inst.inst.samples[inst.inst.samplemap[ch.note]];
                ch.vol = samp.vol;
                ch.pan = samp.pan;
                ch.fine = samp.fine;
              }
            } 
            ch.triggernote = true;
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
                if (ch.triggernote) {
                  // if we were already triggering the note, reset vol/pan using
                  // (potentially) new sample
                  const samp = inst.inst.samples[inst.inst.samplemap[note]];
                  ch.pan = samp.pan;
                  ch.vol = samp.vol;
                  ch.fine = samp.fine;
                }
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
              console.log("channel", i, "invalid volume", v.toString(16));
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
              console.log("track", track, "volume effect", v.toString(16));
            }
          }

          ch.effectfn = undefined;
          if("fxtype" in event && event.fxtype != -1) {
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
                break;
              }
            } else {
              console.log("channel", i, "effect > 36", ch.effect);
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
    }
    this.cur_row++;
  }


  processTick() {
    if(this.audioctx.currentTime > this.nextTickTime) {
      console.log("Lag!!!");
    }
    var j, ch;
    for (j in song.song.tracks) {
      ch = this.tracks[j];
      ch.periodoffset = 0;
    }
    if (this.cur_tick >= song.song.lpb) {
      this.cur_tick = 0;
    }

    if (this.cur_tick === 0) {
      this.processRow();
    }

    for (j = 0; j < song.song.tracks.length; j += 1) {
      ch = this.tracks[j];
      var inst = ch.inst;
      if (this.cur_tick !== 0) {
        if(ch.voleffectfn) ch.voleffectfn.bind(this)(ch);
        if(ch.effectfn) ch.effectfn.bind(this)(ch);
      }
      if (isNaN(ch.period)) {
        console.log(this.prettify_notedata(
              song.song.patterns[this.cur_pat].rows[this.cur_row][j]),
            "set channel", j, "period to NaN");
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
    if (this.XMView.pushEvent) {
      this.XMView.pushEvent({
        t: this.nextTickTime,
        songpos: this.cur_songpos,
        pat: this.cur_pat,
        row: this.cur_row
      });
    }
    this.cur_tick++;
  }

  scheduler() {
    var msPerTick = 2.5 / song.song.bpm;
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
      this.tracks[index].mute = !this.tracks[index].mute;
      console.log(this.tracks[index].mute);
      if(this.tracks[index].mute) {
        this.tracks[index].gainNode.gain.value = 0;
      } else {
        this.tracks[index].gainNode.gain.value = 1;
      }
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

  reset() {
    this.cur_pat = song.song.sequence[0].pattern;
    this.cur_row = 0;
    this.cur_songpos = 0;
    this.cur_ticksamp = 0;
    this.cur_tick = 0;

    state.set({
      cursor: {
        sequence: this.cur_songpos,
        pattern: this.cur_pat,
        row: this.cur_row,
      },
    });

    song.song.globalVolume = this.max_global_volume;
  }

  onSongChanged() {
    this.cur_pat = undefined;
    this.cur_row = 0;
    this.cur_songpos = 0;
    this.cur_ticksamp = 0;
    this.cur_tick = 0;
    this.playing = false;
    song.song.globalVolume = this.max_global_volume;

    this.reset();

    console.log("Song changed");

    this.tracks = [];

    // Initialise the channelinfo for each track.
    for(var i = 0; i < song.song.tracks.length; i += 1) {
      var trackinfo = new Track(this.audioctx, this.gainNode);
      this.tracks.push(trackinfo);
    }

    this.instruments = [];
    // Initialise the instrument envelope objects
    for(i = 0; i < song.song.instruments.length; i += 1) {
      const inst = song.song.instruments[i];

      this.instruments.push(new Instrument(inst, this.audioctx));
    }
  }

  onInstrumentChanged(instrumentIndex) {
    // TODO: This is a bit heavy handed, should check what has changed.
    // Requires we switch to immutable for song first.
    try {
      this.instruments[instrumentIndex] = new Instrument(song.song.instruments[instrumentIndex], this.audioctx);
    } catch(e) {
      console.log(e);
    }
  }

  onInstrumentListChanged() {
    this.instruments = [];
    // Initialise the instrument envelope objects
    for(let i = 0; i < song.song.instruments.length; i += 1) {
      const inst = song.song.instruments[i];

      this.instruments.push(new Instrument(inst, this.audioctx));
    }
  }

  onCursorChanged() {
    /*if (!this.playing && state.cursor.get("sequence") != this.cur_songpos) {
      this.cur_songpos = state.cursor.get("sequence");
    }*/
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
    if (data < song.song.sequence.length) {
      this.cur_songpos = data;
      this.cur_pat = song.song.sequence[this.cur_songpos].pattern;
      this.cur_row = -1;
    }
  }

  eff_t0_c(ch, data) {  // set volume
    ch.vol = Math.min(64, data);
  }

  eff_t0_d(ch, data) {  // pattern jump
    this.cur_songpos++;
    if (this.cur_songpos >= song.song.sequence.length)
      this.cur_songpos = song.song.loopPosition;
    this.cur_pat = song.song.sequence[this.cur_songpos].pattern;
    this.cur_row = (data >> 4) * 10 + (data & 0x0f) - 1;
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
        console.log("unimplemented extended effect E", ch.effectdata.toString(16));
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
      song.song.lpb = data;
    } else {
      song.song.bpm = data;
    }
  }

  eff_t0_g(ch, data) {  // set global volume
    if (data <= 0x40) {
      // volume gets multiplied by 2 to match
      // the initial max global volume of 128
      song.song.globalVolume = Math.max(0, data * 2);
    } else {
      song.song.globalVolume = this.max_global_volume;
    }
  }

  eff_t0_h(ch, data) {  // global volume slide
    if (data) {
      // same as Axy but multiplied by 2
      song.song.globalVolumeslide = (-(data & 0x0f) + (data >> 4)) * 2;
    }
  }

  eff_t1_h(ch) {  // global volume slide
    if (song.song.globalVolumeslide !== undefined) {
      song.song.globalVolume = Math.max(0, Math.min(this.max_global_volume,
        song.song.globalVolume + song.song.globalVolumeslide));
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
    console.log("unimplemented effect", this.prettify_effect(ch.effect, data));
  }
}

export let player = new Player(); 
