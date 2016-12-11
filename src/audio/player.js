import Signal from '../utils/signal';

import { state } from '../state';
import { song } from '../utils/songmanager';
import Envelope from './envelope';

class EnvelopeFollower {
  constructor(env) {
    this.env = env;
    this.tick = 0;
  }

  Tick(release) {
    var value = this.env.Get(this.tick);

    // if we're sustaining a note, stop advancing the tick counter
    if (!release && this.tick >= this.env.points[this.env.sustain*2]) {
      return this.env.points[this.env.sustain*2 + 1];
    }

    this.tick++;
    if (this.env.type & 4) {  // envelope loop?
      if (!release &&
          this.tick >= this.env.loopend) {
        this.tick -= this.env.loopend - this.env.loopstart;
      }
    }
    return value;
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
        tracks: {
          t: e.t,
          vu: e.vu,
          scopes: e.scopes,
        }
      });
      this.shown_row = e.row;
      this.shown_pat = e.pat;
    }
    if(this.player.playing) {
      window.requestAnimationFrame(this.redrawScreen);
    }
  }
}

class PlayerInstrument {
  constructor(instrument, channel, note, time) {
    this.instrument = instrument;
    this.sourceNode = instrument.ctx.createBufferSource();
    this.gainNode = instrument.ctx.createGain();
    this.gainNode.connect(channel.gainNode);
    const rate = this.periodForNote(channel, note);
    //const rate = 8363 * Math.pow(2, (note - 48) / 12.0) / instrument.ctx.sampleRate;  
    this.sourceNode.playbackRate.value = rate;
    this.sourceNode.connect(this.gainNode);
    const sample = instrument.samples[instrument.inst.samplemap[note]];
    this.sourceNode.buffer = sample.buffer;
    if (sample.loop) {
      this.sourceNode.loop = sample.loop;
      this.sourceNode.loopStart = sample.loopStart;
      this.sourceNode.loopEnd = sample.loopEnd;
    }
    this.volumeEnvelope = new EnvelopeFollower(instrument.envelopes.volume);
    this.panningEnvelope = new EnvelopeFollower(instrument.envelopes.panning);
    this.sourceNode.start(time);
  }

  updateVolumeEnvelope(time, release) {
    let volE = this.volumeEnvelope.Tick(release);
    //let panE = this.panningEnvelope.Tick(release);
    //volE = ch.volE / 64.0;    // current volume envelope
    //panE = 4*(ch.panE - 32);  // current panning envelope
    //var p = panE + ch.pan - 128;  // final pan
    this.gainNode.gain.value = volE / 64;
  }

  stop(time) {
    this.sourceNode.stop(time);
  }

  updateChannelPeriod(ch, period) {
    var freq = 8363 * Math.pow(2, (1152.0 - period) / 192.0);
    if (isNaN(freq)) {
      console.log("invalid period!", period);
      return;
    }
    var rate = freq / this.instrument.ctx.sampleRate;

    this.sourceNode.playbackRate.value = rate;
    
    //ch.doff = freq / this.f_smp;
    //ch.filter = this.filterCoeffs(ch.doff / 2);
  }

  periodForNote(ch, note) {
    return 1920 - (note + ch.samp.note)*16 - ch.fine / 8.0;
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
    this.buffers = [];
    if (inst.samples && inst.samples.length > 0) {
      const buf = ctx.createBuffer(1, inst.samples[0].len, ctx.sampleRate);
      var chan = buf.getChannelData(0);
      var loop = false;
      var loopStart = -1;
      var loopEnd = -1;
      try {
        for(var s = 0; s < inst.samples[0].len; s += 1) {
          chan[s] = inst.samples[0].sampledata[s];
        }
        if (inst.samples[0].looplen !== 0) {
          loop = true;
          loopStart = (buf.duration / buf.length) * inst.samples[0].loop;
          loopEnd = loopStart + ((buf.duration / buf.length) * inst.samples[0].looplen);
        }
      } catch(e) {
        console.log(e);
      }
      this.samples.push({
        buffer: buf,
        loop,
        loopStart,
        loopEnd,
      });
    }
    if (inst.env_vol) {
      this.envelopes.volume = new Envelope(
        inst.env_vol.points,
        inst.env_vol.type,
        inst.env_vol.sustain,
        inst.env_vol.loopstart,
        inst.env_vol.loop_end);
    }
    if (inst.env_pan) {
      this.envelopes.panning = new Envelope(
        inst.env_pan.points,
        inst.env_pan.type,
        inst.env_pan.sustain,
        inst.env_pan.loopstart,
        inst.env_pan.loop_end);
    }
  }

  playNoteOnChannel(channel, time, note) {
    return new PlayerInstrument(this, channel, note, time);
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

    this.oscillatorNode = this.audioctx.createOscillator();
    this.oscillatorNode.frequency.value = 220;
    this.oscillatorNode.connect(this.gainNode);

    this.gainNode.connect(this.audioctx.destination);

    this.playing = false;
    this.timerID = undefined;
    this.lookahead = 20;
    this.scheduleAheadTime = 0.1;

    this.XMView = new XMViewObject(this);

    Signal.connect(song, 'songChanged', this, 'onSongChanged');
    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
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

  periodForNote(ch, note) {
    return 1920 - (note + ch.samp.note)*16 - ch.fine / 8.0;
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

  nextRow() {
    this.cur_row++;
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
          var triggernote = false;
          var event = {};
          if ("notedata" in track && track.notedata.length > 0) {
            event = track.notedata[0];
          }
          // instrument trigger
          if ("note" in event && event.note != -1) {
            inst = this.instruments[event.instrument - 1];
            if (inst && inst.inst && inst.inst.samplemap) {
              ch.inst = inst;
              // retrigger unless overridden below
              triggernote = true;
              if (ch.note && inst.inst.samplemap) {
                ch.samp = inst.inst.samples[inst.inst.samplemap[ch.note]];
                ch.vol = ch.samp.vol;
                if(ch.gainNode) {
                  ch.gainNode.gain.setValueAtTime(Math.min(64, ch.vol)/64, this.nextTickTime);
                }
                ch.pan = ch.samp.pan;
                ch.fine = ch.samp.fine;
              }
            } else {
              console.log("invalid inst", event.instrument, this.instruments.length, inst);
            }
            triggernote = true;
          }

          // note trigger
          if ("note" in event && event.note != -1) {
            if (event.note == 96) {
              ch.release = 1;
              triggernote = false;
            } else {
              if (inst && inst.inst && inst.inst.samplemap) {
                var note = event.note;
                ch.note = note;
                ch.samp = inst.inst.samples[inst.inst.samplemap[note]];
                if (triggernote) {
                  // if we were already triggering the note, reset vol/pan using
                  // (potentially) new sample
                  ch.pan = ch.samp.pan;
                  ch.vol = ch.samp.vol;
                  if(ch.gainNode) {
                    ch.gainNode.gain.setValueAtTime(Math.min(64, ch.vol)/64, this.nextTickTime);
                  }
                  ch.fine = ch.samp.fine;
                }
                triggernote = true;
              }
              triggernote = true;
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
                triggernote = false;
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
                ch.periodtarget = this.periodForNote(ch, ch.note);
              }
              triggernote = false;
              if (inst && inst.inst && inst.inst.samplemap) {
                if (ch.currentlyPlaying == undefined) {
                  // note wasn't already playing; we basically have to ignore the
                  // portamento and just trigger
                  triggernote = true;
                } else if (ch.release) {
                  console.log("Releaing");
                  // reset envelopes if note was released but leave offset/pitch/etc
                  // alone
                  ch.envtick = 0;
                  ch.release = 0;
                  //ch.env_vol = new EnvelopeFollower(ch.envelopes.env_vol);
                  //ch.env_pan = new EnvelopeFollower(ch.envelopes.env_pan);
                }
              }
            }
          }

          if (triggernote) {
            // there's gotta be a less hacky way to handle offset commands...
            if (ch.effect != 9) ch.off = 0;
            ch.release = 0;
            ch.envtick = 0;
            //ch.env_vol = new EnvelopeFollower(ch.envelopes.env_vol);
            //ch.env_pan = new EnvelopeFollower(ch.envelopes.env_pan);
            if (ch.note) {
              ch.period = this.periodForNote(ch, ch.note);
            }
            // waveforms 0-3 are retriggered on new notes while 4-7 are continuous
            if (ch.vibratotype < 4) {
              ch.vibratopos = 0;
            }
            if(ch.currentlyPlaying) {
              ch.currentlyPlaying.stop(this.nextTickTime);
            }
            ch.currentlyPlaying = ch.inst.playNoteOnChannel(ch, this.nextTickTime, ch.note);
          }
        }
      }
    }
  }


  nextTick() {
    this.cur_tick++;
    var j, ch;
    for (j in song.song.tracks) {
      ch = this.tracks[j];
      ch.periodoffset = 0;
    }
    if (this.cur_tick >= song.song.lpb) {
      this.cur_tick = 0;
      this.nextRow();
    }
    for (j in song.song.tracks) {
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
      if (inst === undefined) continue;
      /*if (ch.env_vol === undefined) {
        console.log(this.prettify_notedata(
              song.song.patterns[this.cur_pat].rows[this.cur_row][j]),
            "set channel", j, "env_vol to undefined, but note is playing");
        continue;
      }*/
      if(ch.currentlyPlaying) {
        ch.currentlyPlaying.updateVolumeEnvelope(this.nextTickTime, ch.release);
        ch.currentlyPlaying.updateChannelPeriod(ch, ch.period + ch.periodoffset);
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
  }

  scheduler() {
    //console.log("Tick!");

    var msPerTick = 2.5 / song.song.bpm;
    var notes = 0;
    while(this.nextTickTime < (this.audioctx.currentTime + this.scheduleAheadTime)) {
      this.nextTick();
      notes += 1;
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
    }
  }

  _play() {
    if (!this.playing) {
      // put paused events back into action, if any
      if (this.XMView.resume) this.XMView.resume();
      // start playing
      this.oscillatorNode.connect(this.gainNode);

      this.nextTickTime = this.audioctx.currentTime;
    
      this.timerID = setInterval(() => { this.scheduler(); }, this.lookahead);
    }
    this.playing = true;
    this.nextRow();
  }

  pause() {
    if (this.playing) {
      this.oscillatorNode.disconnect(this.gainNode);
      if (this.XMView.pause) this.XMView.pause();
    }
    this.playing = false;
    if(this.timerID) {
      clearInterval(this.timerID);
    }
  }

  reset() {
    if (this.playing) {
      this.jsNode.disconnect(this.gainNode);
      this.playing = false;
    }
    this.cur_pat = undefined;
    this.cur_row = 768;
    this.cur_songpos = -1;
    this.cur_ticksamp = 0;

    state.set({
      cursor: {
        sequence: this.cur_songpos,
        pattern: this.cur_pat,
        row: this.cur_row,
      },
    });

    song.song.globalVolume = this.max_global_volume;
    if (this.XMView.stop) this.XMView.stop();
    //init();
  }

  onSongChanged() {
    this.cur_pat = undefined;
    this.cur_row = -1;
    this.cur_songpos = -1;
    this.cur_ticksamp = 0;
    this.playing = false;
    song.song.globalVolume = this.max_global_volume;

    console.log("Song changed");

    this.tracks = [];

    // Initialise the channelinfo for each track.
    for(var i = 0; i < song.song.tracks.length; i += 1) {
      var trackinfo = {
        number: i,
        filterstate: new Float32Array(3),
        vol: 0,
        pan: 128,
        period: 1920 - 48*16,
        vL: 0, vR: 0,   // left right volume envelope followers (changes per sample)
        vLprev: 0, vRprev: 0,
        mute: 0,
        volE: 0, panE: 0,
        retrig: 0,
        vibratopos: 0,
        vibratodepth: 1,
        vibratospeed: 1,
        vibratotype: 0,
        gainNode: this.audioctx.createGain(),
      };
      this.tracks.push(trackinfo);
      trackinfo.gainNode.connect(this.audioctx.destination);
      trackinfo.gainNode.gain.value = 1.0;
    }

    this.instruments = [];
    // Initialise the instrument envelope objects
    for(i = 0; i < song.song.instruments.length; i += 1) {
      const inst = song.song.instruments[i];

      this.instruments.push(new Instrument(inst, this.audioctx));
    }
  }

  onCursorChanged() {
    /*if (!this.playing && state.cursor.get("sequence") != this.cur_songpos) {
      this.cur_songpos = state.cursor.get("sequence");
    }*/
  }

  eff_t1_0(ch) {  // arpeggio
    if (ch.effectdata !== 0 && ch.inst !== undefined) {
      var arpeggio = [0, ch.effectdata>>4, ch.effectdata&15];
      var note = ch.note + arpeggio[this.cur_tick % 3];
      ch.period = this.periodForNote(ch, note);
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
      console.log("eff_t1_1");
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
      if(ch.gainNode) {
        ch.gainNode.gain.setValueAtTime(Math.min(64, ch.vol)/64, this.nextTickTime);
      }
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
    if(ch.gainNode) {
      ch.gainNode.gain.setValueAtTime(Math.min(64, data)/64, this.nextTickTime);
    }
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
