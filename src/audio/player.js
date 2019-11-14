// eslint-disable-next-line import/no-webpack-loader-syntax
import SharedWorker from 'sharedworker-loader!./timerworker';
import Tuna from 'tunajs';

import { signal, connect } from '../utils/signal';

import { state } from '../state';
import { song } from '../utils/songmanager';
import XMViewObject from './xmviewobject';
import Instrument from './instrument';
import Track from './track';

import AudioMeter from './vumeter';

export const SILENT = 'silent';
export const SOLO = 'solo';
export const MUTE = 'mute';
export const NORMAL = 'normal';
export const OFF = 'off';

class Player {
  constructor() {
    this.tracks = [];
    this.instruments = [];

    // per-sample exponential moving average for volume changes (to prevent pops
    // and clicks); evaluated every 8 samples
    this.popfilter_alpha = 0.9837;

    this.cur_songpos = -1;
    this.jump_songpos = undefined;
    this.cur_pat = undefined;
    this.jump_pat = undefined;
    this.cyclePattern = undefined;
    this.cur_row = 0;
    this.jump_row = undefined;
    this.cur_ticksamp = 0;
    this.cur_tick = 0;
    this.globalVolume = 128;
    this.max_global_volume = this.globalVolume;
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
      this.eff_unimplemented,  // z
    ];

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioctx = new AudioContext();
    this.tuna = new Tuna(this.audioctx);

    this.masterGain = this.audioctx.createGain();
    this.vuMeter = new AudioMeter(this.audioctx);
    this.masterGain.connect(this.vuMeter.processor);
    this.masterGain.connect(this.audioctx.destination);

    this.masterAnalyser = this.audioctx.createAnalyser();

    this.masterAnalyser.fftSize = 64;
    this.masterAnalyserBufferLength = this.masterAnalyser.frequencyBinCount;
    this.masterAnalyserScopeData = new Uint8Array(this.masterAnalyserBufferLength);
    this.masterAnalyserFreqData = new Uint8Array(this.masterAnalyserBufferLength);
    this.masterGain.connect(this.masterAnalyser);

    connect(this.vuMeter, 'vuChanged', this, 'onVuChanged');

    this.playing = false;
    this.lookahead = 25;
    this.scheduleAheadTime = 0.3;

    this.playingInteractive = false;
    this.interactiveLookahead = 10;
    this.interactiveScheduleAheadTime = 0.01;

    this.XMView = new XMViewObject(this);

    this.timerWorker = new SharedWorker();
    this.timerWorker.port.postMessage({ interval: this.lookahead });
    this.timerWorker.port.onmessage = this.onTimerMessage.bind(this);
    this.timerWorker.onerror = function timerError(e) {
      throw new Error(`${e.message} (${e.filename}:${e.lineno})`);
    };
    this.timerWorker.port.start();

    this.interactiveTimerWorker = new SharedWorker();
    this.interactiveTimerWorker.port.postMessage({ interval: this.interactiveLookahead });
    this.interactiveTimerWorker.port.onmessage = this.onInteractiveTimerMessage.bind(this);
    this.interactiveTimerWorker.port.start();

    this.playingInstruments = [];

    this.tracksChanged = signal(false);
    this.outputChanged = signal(false);
    this.trackStateChanged = signal(false);

    this.setupMediaRecorder();

    connect(song, 'songChanged', this, 'onSongChanged');
    connect(song, 'bpmChanged', this, 'onBpmChanged');
    connect(song, 'speedChanged', this, 'onSpeedChanged');
    connect(song, 'instrumentChanged', this, 'onInstrumentChanged');
    connect(song, 'instrumentListChanged', this, 'onInstrumentListChanged');
    connect(song, 'trackEffectChainChanged', this, 'onTrackEffectChainChanged');
    connect(song, 'trackEffectChanged', this, 'onTrackEffectChanged');
    connect(state, 'cursorChanged', this, 'onCursorChanged');
    connect(state, 'transportChanged', this, 'onTransportChanged');
  }

  setupMediaRecorder() {
    this.mediaRecorder = null;

    const types = [
      'audio/webm; codecs=opus',
      'audio/webm',
    ];

    let type;
    for (let i = 0; i < types.length; i += 1) {
      if (MediaRecorder.isTypeSupported(types[i])) {
        type = types[i];
        break;
      }
    }

    if (type) {
      this.mediaStreamDest = this.audioctx.createMediaStreamDestination();
      this.mediaRecorder = new MediaRecorder(this.mediaStreamDest.stream, { mimeType: type });
      this.mediaChunks = [];

      this.mediaRecorder.ondataavailable = (evt) => {
        // push each chunk (blobs) in an array
        this.mediaChunks.push(evt.data);
      };

      this.mediaRecorder.onstop = () => {
        // Make blob out of our blobs, and open it.
        const blob = new Blob(this.mediaChunks, { type: 'audio/webm; codecs=opus' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        let name = state.song.get('name');
        name = name ? `${name.trim()}.webm` : 'wetracker-song.webm';
        a.download = name;
        a.click();
      };
    }
  }

  onTimerMessage(e) {
    if (e.data === 'tick') {
      this.scheduler();
    }
  }

  onInteractiveTimerMessage(e) {
    if (e.data === 'tick') {
      const msPerTick = 2.5 / this.bpm;
      while (this.nextInteractiveTickTime < (this.audioctx.currentTime + this.interactiveScheduleAheadTime)) {
        let i = this.playingInstruments.length - 1;
        while (i >= 0) {
          if (this.playingInstruments[i].updateVolumeEnvelope(this.nextInteractiveTickTime, this.globalVolume)) {
            this.stopInteractiveInstrument(this.playingInstruments[i]);
          }
          i -= 1;
        }
        this.nextInteractiveTickTime += msPerTick;
      }
      this.XMView.pushEvent({
        t: -1,
      });
    }
  }

  playNoteOnCurrentChannel(note, finished) {
    const track = this.tracks[state.cursor.get('track')];
    const channel = track.columns[0];
    const instrument = this.instruments[state.cursor.get('instrument')];
    const time = this.audioctx.currentTime;

    if (this.playingInstruments.length === 0) {
      this.nextInteractiveTickTime = this.audioctx.currentTime;
      this.interactiveTimerWorker.port.postMessage('start');
      this.XMView.start();
      this.playingInteractive = true;
    }

    // If any other instruments are still playing but have been released, stop them.
    for (let i = this.playingInstruments.length - 1; i >= 0; i -= 1) {
      if (this.playingInstruments[i].release) {
        this.playingInstruments[i].stop(time);
      }
    }

    try {
      const samp = instrument.inst.samples[instrument.inst.samplemap[note]];
      channel.pan = samp.pan;
      channel.vol = samp.vol;
      channel.fine = samp.fine;
      const instr = instrument.playNoteOnChannel(channel, time, note, (finInstr) => {
        const index = this.playingInstruments.indexOf(finInstr);
        if (index !== -1) {
          this.playingInstruments.splice(index, 1);
          if (this.playingInstruments.length === 0) {
            this.interactiveTimerWorker.port.postMessage('stop');
            // this.XMView.stop();
            this.XMView.pushEvent({
              t: -1,
            });
            this.playingInteractive = false;
          }
        }
        if (finished && typeof finished === 'function') {
          finished(finInstr);
        }
      });
      instr.release = false;
      this.playingInstruments.push(instr);
      return instr;
    } catch (e) {
      return undefined;
    }
  }

  releaseInteractiveInstrument(playerInstrument) {
    const index = this.playingInstruments.indexOf(playerInstrument);
    if (index !== -1) {
      playerInstrument.release = true; // eslint-disable-line no-param-reassign
    }
  }

  stopInteractiveInstrument(playerInstrument) {
    const time = this.audioctx.currentTime;
    playerInstrument.stop(time);
  }

  currentTime() {
    return this.audioctx.currentTime;
  }

  updateChannelPeriod(ch, period) {
    const freq = 8363 * (2 ** ((4608.0 - period) / 768.0));
    if (isNaN(freq)) {
      console.log('invalid period!', period);
      return;
    }
    ch.doff = freq / this.f_smp; // eslint-disable-line no-param-reassign
    ch.filter = this.filterCoeffs(ch.doff / 2); // eslint-disable-line no-param-reassign
  }


  setCurrentPattern() {
    let nextPat = song.getSequencePatternNumber(this.cur_songpos);

    // check for out of range pattern index
    const maxpat = song.getNumPatterns();
    const maxseq = song.getSequenceLength();
    while (nextPat >= maxpat) {
      if ((this.cur_songpos + 1) < maxseq) {
        // first try skipping the position
        this.cur_songpos += 1;
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

  nextRow() {
    this.cur_row += 1;
    if (this.cur_pat == null || this.cur_row >= song.getPatternRowCount(this.cur_pat)) {
      if (this.cyclePattern != null) {
        this.cur_pat = this.cyclePattern;
        this.cur_row = 0;
      } else {
        this.cur_row = 0;
        this.cur_songpos += 1;
        if (this.cur_songpos >= song.getSequenceLength()) {
          if (state.cursor.get('saveStream')) {
            this.stop();
            this.stopRecordingStream();
          } else {
            this.cur_songpos = song.getLoopPosition();
          }
        }
        this.setCurrentPattern();
      }
    }
  }

  processRow() {
    const numtracks = song.getNumTracks();
    this.jump_songpos = undefined;
    this.jump_pat = undefined;
    this.jump_row = undefined;
    for (let trackindex = 0; trackindex < numtracks; trackindex += 1) {
      const track = song.getTrackDataForPatternRow(this.cur_pat, this.cur_row, trackindex);
      const numcols = this.tracks[trackindex].columns.length;
      for (let colindex = 0; colindex < numcols; colindex += 1) {
        const ch = this.tracks[trackindex].columns[colindex];
        let { inst } = ch;
        ch.triggernote = false;
        let event = {};
        if ('notedata' in track && colindex < track.notedata.length && track.notedata[colindex]) {
          event = track.notedata[colindex];
        }

        // instrument trigger
        if ('instrument' in event && event.instrument !== -1) {
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
              if (ch.currentlyPlaying) {
                ch.currentlyPlaying.resetEnvelopes();
              }
            }
          }
        }

        // note trigger
        if ('note' in event && event.note !== -1) {
          if (event.note === 96) {
            ch.release = 1;
            ch.triggernote = false;
          } else {
            if (inst && inst.inst && inst.inst.samplemap) {
              const { note } = event;
              ch.note = note;
              if ('instrument' in event && event.instrument !== -1) {
                const samp = inst.inst.samples[inst.inst.samplemap[note]];
                ch.pan = samp.pan;
                ch.vol = samp.vol;
                ch.fine = samp.fine;
              }
            }
            ch.triggernote = true;
          }
        }

        ch.voleffectfn = undefined;
        if ('volume' in event && event.volume !== -1) {  // volume column
          const v = event.volume;
          ch.voleffectdata = v & 0x0f; // eslint-disable-line no-bitwise
          if (v < 0x10) {
            if (v !== 0) {
              console.log('Track', trackindex, 'invalid volume', event.volume.toString(16));
            }
          } else if (v <= 0x50) {
            ch.vol = v - 0x10;
          } else if (v >= 0x60 && v < 0x70) {  // volume slide down
            ch.voleffectfn = (tr) => {
              tr.vol = Math.max(0, tr.vol - tr.voleffectdata); // eslint-disable-line no-param-reassign
            };
          } else if (v >= 0x70 && v < 0x80) {  // volume slide up
            ch.voleffectfn = (tr) => {
              tr.vol = Math.min(64, tr.vol + tr.voleffectdata); // eslint-disable-line no-param-reassign
            };
          } else if (v >= 0x80 && v < 0x90) {  // fine volume slide down
            ch.vol = Math.max(0, ch.vol - (v & 0x0f)); // eslint-disable-line no-bitwise
          } else if (v >= 0x90 && v < 0xa0) {  // fine volume slide up
            ch.vol = Math.min(64, ch.vol + (v & 0x0f)); // eslint-disable-line no-bitwise
          } else if (v >= 0xa0 && v < 0xb0) {  // vibrato speed
            ch.vibratospeed = v & 0x0f; // eslint-disable-line no-bitwise
          } else if (v >= 0xb0 && v < 0xc0) {  // vibrato w/ depth
            ch.vibratodepth = v & 0x0f; // eslint-disable-line no-bitwise
            /* eslint-disable prefer-destructuring */
            ch.voleffectfn = this.effects_t1[4];  // use vibrato effect directly
            const tempeffectfn = this.effects_t1[4];
            /* eslint-enable prefer-destructuring */
            if (tempeffectfn) {
              tempeffectfn.bind(this)(ch);  // and also call it on tick 0
            }
          } else if (v >= 0xc0 && v < 0xd0) {  // set panning
            ch.pan = (v & 0x0f) * 0x11; // eslint-disable-line no-bitwise
          } else if (v >= 0xf0 && v <= 0xff) {  // portamento
            if (v & 0x0f) { // eslint-disable-line no-bitwise
              ch.portaspeed = (v & 0x0f) << 4; // eslint-disable-line no-bitwise
            }
            ch.voleffectfn = this.effects_t1[3].bind(this);  // just run 3x0
          } else {
            console.log('Track', trackindex, 'volume effect', v.toString(16));
          }
        }

        ch.effectfn = undefined;
        if (('fxtype' in event && 'fxparam' in event) && (event.fxtype !== -1 || event.fxparam !== 0)) {
          try {
            ch.effect = event.fxtype;
            ch.effectdata = event.fxparam;
            if (ch.effect < 36) {
              ch.effectfn = this.effects_t1[ch.effect];
              const effT0 = this.effects_t0[ch.effect];
              if (effT0 && effT0.bind(this)(ch, ch.effectdata)) {
                ch.triggernote = false;
              }
            } else {
              console.log('Track', trackindex, 'effect > 36', ch.effect);
            }

            // special handling for portamentos: don't trigger the note
            if (ch.effect === 3 || ch.effect === 5 || event.volume >= 0xf0) {
              if (event.note !== -1) {
                ch.periodtarget = ch.inst.periodForNote(ch.note, ch.fine);
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
          } catch (e) {
            console.log(e);
          }
        }

        if (ch.triggernote) {
          // there's gotta be a less hacky way to handle offset commands...
          if (ch.effect !== 9) {
            ch.off = 0;
          }
          ch.release = 0;
          ch.envtick = 0;
          if (ch.note) {
            ch.period = ch.inst.periodForNote(ch.note, ch.fine);
          }
          // waveforms 0-3 are retriggered on new notes while 4-7 are continuous
          if (ch.vibratotype < 4) {
            ch.vibratopos = 0;
          }
        }
      }
    }
  }


  processTick() {
    if (!this.playing) {
      return;
    }
    if (this.audioctx.currentTime > this.nextTickTime) {
      console.log('Lag!!!');
    }
    for (let j = 0; j < this.tracks.length; j += 1) {
      for (let c = 0; c < this.tracks[j].columns.length; c += 1) {
        this.tracks[j].columns[c].periodoffset = 0;
      }
    }

    if (this.cur_tick === 0) {
      if (this.jump_row != null && this.jump_pat != null && this.jump_songpos != null) {
        this.cur_songpos = this.jump_songpos;
        this.cur_pat = this.jump_pat;
        this.cur_row = this.jump_row;
      }
      this.processRow();
    }

    for (let j = 0; j < this.tracks.length; j += 1) {
      const track = this.tracks[j];
      for (let c = 0; c < track.columns.length; c += 1) {
        const ch = track.columns[c];
        const { inst } = ch;
        if (inst !== undefined) {
          if (this.cur_tick !== 0) {
            if (ch.voleffectfn) ch.voleffectfn.bind(this)(ch);
            if (ch.effectfn) ch.effectfn.bind(this)(ch);
          }
          if (isNaN(ch.period)) {
            throw Error('NaN Period');
          }

          if (ch.triggernote) {
            if (ch.currentlyPlaying) {
              ch.currentlyPlaying.stop(this.nextTickTime);
            }
            ch.currentlyPlaying = ch.inst.playNoteOnChannel(ch, this.nextTickTime, ch.note);
            ch.triggernote = false;
          }
          if (ch.currentlyPlaying) {
            ch.currentlyPlaying.release = ch.release;
            if (ch.currentlyPlaying.updateVolumeEnvelope(this.nextTickTime, this.globalVolume)) {
              ch.currentlyPlaying.stop(this.nextTickTime);
              ch.currentlyPlaying = null;
            } else {
              ch.currentlyPlaying.updateChannelPeriod(this.nextTickTime, ch.period + ch.periodoffset);
            }
          }
        }
      }
    }
    this.XMView.pushEvent({
      t: this.nextTickTime,
      songpos: this.cur_songpos,
      pat: this.cur_pat,
      row: this.cur_row,
    });
  }

  scheduler() {
    const msPerTick = 2.5 / this.bpm;
    while (this.nextTickTime < (this.audioctx.currentTime + this.scheduleAheadTime)) {
      this.processTick();
      this.cur_tick += 1;
      if (this.cur_tick >= this.speed) {
        this.cur_tick = 0;
        this.nextRow();
      }
      this.nextTickTime += msPerTick;
    }
  }

  playPattern(sequence) {
    const pattern = song.getSequencePatternNumber(sequence);
    this.cyclePattern = pattern;
    this.cur_pat = pattern;
    this.cur_row = -1;
    this.cur_songpos = sequence;

    state.set({
      cursor: {
        pattern,
        sequence,
        row: 0,
      },
    });

    this.startPlaying();
  }

  play() {
    this.cyclePattern = null;
    this.startPlaying();
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
          },
        });
        this.tracks[index].gainNode.gain.value = 0;
      }
      this.XMView.pushEvent({
        t: -1,
      });

      const states = this.tracks.map((t) => t.getState());
      console.log(states);
      this.trackStateChanged({
        states,
      });
    }
  }

  toggleSoloTrack(index) {
    if (index < this.tracks.length) {
      const currentState = this.tracks[index].getState();
      if (currentState.state === SOLO) {
        // If we've clicked on the solo'd track, just pop state back
        // to previous.
        for (let t = 0; t < this.tracks.length; t += 1) {
          this.tracks[t].popState();
        }
      } else if (currentState.state === SILENT) {
        // We've clicked on a silent track, set it's state to solo
        // and the current solo'd track to silent.
        for (let t = 0; t < this.tracks.length; t += 1) {
          if (t === index) {
            this.tracks[t].setState({
              state: SOLO,
              properties: {
                gain: 1,
              },
            });
          } else {
            this.tracks[t].setState({
              state: SILENT,
              properties: {
                gain: 0,
              },
            });
          }
        }
      } else {
        // We're not in solo mode, so enter it now.
        for (let t = 0; t < this.tracks.length; t += 1) {
          if (t === index) {
            this.tracks[t].pushState({
              state: SOLO,
            });
          } else {
            this.tracks[t].pushState({
              state: SILENT,
              properties: {
                gain: 0,
              },
            });
          }
        }
      }
      this.XMView.pushEvent({
        t: -1,
      });
    }
  }

  startRecordingStream() {
    if (this.mediaRecorder == null) {
      return;
    }
    try {
      this.masterGain.disconnect(this.audioctx.destination);
    } catch (e) {
      console.log(e);
    }
    this.masterGain.connect(this.mediaStreamDest);
    this.mediaRecorder.start();
  }

  stopRecordingStream() {
    if (this.mediaRecorder == null) {
      return;
    }
    this.mediaRecorder.stop();
    try {
      this.masterGain.disconnect(this.mediaStreamDest);
    } catch (e) {
      console.log(e);
    }
    this.masterGain.connect(this.audioctx.destination);

    state.set({
      cursor: {
        saveStream: false,
      },
    });

    if (this.recordDoneResolve) {
      this.recordDoneResolve();
      this.recordDoneResolve = undefined;
    }
  }

  record() {
    this.stop();
    this.reset();
    // start playing
    this.nextTickTime = this.audioctx.currentTime;

    this.startRecordingStream();

    const promise = new Promise((resolve) => {
      this.recordDoneResolve = resolve;
      this.timerWorker.port.postMessage('start');
      this.playing = true;
    });

    return promise;
  }


  startPlaying() {
    if (!this.playing) {
      // put paused events back into action, if any
      if (this.XMView.resume) this.XMView.resume();
      // start playing
      this.nextTickTime = this.audioctx.currentTime;
      this.timerWorker.port.postMessage('start');
    }
    this.playing = true;
  }

  pause() {
    if (this.playing) {
      if (this.XMView.pause) this.XMView.pause();
    }
    this.playing = false;

    this.timerWorker.port.postMessage('stop');
  }

  stop() {
    if (this.playing) {
      if (this.XMView.stop) this.XMView.stop();
    }
    this.playing = false;

    this.timerWorker.port.postMessage('stop');

    for (let i = 0; i < this.tracks.length; i += 1) {
      const track = this.tracks[i];
      for (let c = 0; c < track.columns.length; c += 1) {
        if (track.columns[c].currentlyPlaying) {
          track.columns[c].currentlyPlaying.stop(this.audioctx.currentTime);
          track.columns[c].currentlyPlaying = undefined;
        }
      }
    }

    for (let i = this.playingInstruments.length - 1; i >= 0; i -= 1) {
      this.playingInstruments[i].stop(this.audioctx.currentTime);
      this.playingInstruments.splice(i, 1);
    }

    this.reset();
  }

  setMasterVolume(dB) {
    const gain = 10 ** (dB / 20);
    this.masterGain.gain.value = gain;
  }

  reset() {
    this.cur_pat = song.getSequencePatternNumber(0);
    this.cur_row = 0;
    this.cur_songpos = 0;
    this.cur_ticksamp = 0;
    this.cur_tick = 0;
    this.speed = song.getSpeed();
    this.bpm = song.getBpm();

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

    this.tracks = [];

    // Initialise the channelinfo for each track.
    const numtracks = song.getNumTracks();
    for (let i = 0; i < numtracks; i += 1) {
      const trackinfo = new Track(this.audioctx, this.masterGain, i);
      trackinfo.pushState({
        state: NORMAL,
        properties: {
          gain: 1,
        },
      });
      this.tracks.push(trackinfo);
      const effects = song.getTrackEffects(i);
      trackinfo.buildEffectChain(effects, this.tuna);
    }

    this.instruments = [];
    const numinstruments = song.getNumInstruments();
    // Initialise the instrument envelope objects
    for (let i = 0; i < numinstruments; i += 1) {
      this.instruments.push(new Instrument(i, this.audioctx));
    }

    this.XMView.pushEvent({
      t: -1,
    });
  }

  onBpmChanged(bpm) {
    this.bpm = bpm;
  }

  onSpeedChanged(speed) {
    this.speed = speed;
  }

  onInstrumentChanged(instrumentIndex) {
    try {
      this.instruments[instrumentIndex] = new Instrument(instrumentIndex, this.audioctx);
    } catch (e) {
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
  }

  onTransportChanged() {
    if (this.masterVolume !== state.transport.get('masterVolume')) {
      this.masterVolume = state.transport.get('masterVolume');
      this.setMasterVolume(state.transport.get('masterVolume'));
    }
  }

  onTrackEffectChainChanged(trackIndex) {
    try {
      const effects = song.getTrackEffects(trackIndex);
      this.tracks[trackIndex].buildEffectChain(effects, this.tuna);
    } catch (e) {
      console.log(e);
    }
  }

  onTrackEffectChanged(track, index, effect) {
    try {
      const fx = this.tracks[track].effectChain[index];
      fx.updateFromParameterObject(effect);
    } catch (e) {
      console.log(e);
    }
  }

  onVuChanged() {
    this.outputChanged({
      volume: this.vuMeter.peak,
      clipping: this.vuMeter.checkClipping(),
    });
  }

  /* Load a local sound file using the player specific knowledge of formats
   */
  loadSampleFromFile(file, callback) {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        this.audioctx.decodeAudioData(e.target.result, (data) => {
          const floatData = data.getChannelData(0);
          if (callback) {
            callback(data, floatData);
          }
        });
      } catch (error) {
        console.log(error);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  updateMasterAnalyserScopeData() {
    this.masterAnalyser.getByteTimeDomainData(this.masterAnalyserScopeData);
    this.masterAnalyser.getByteFrequencyData(this.masterAnalyserFreqData);
  }

  /* eslint-disable camelcase, no-param-reassign, no-bitwise */
  eff_t1_0(ch) {  // arpeggio
    if (ch.effectdata !== 0 && ch.inst !== undefined) {
      const arpeggio = [0, ch.effectdata >> 4, ch.effectdata & 15];
      const note = ch.note + arpeggio[this.cur_tick % 3];
      ch.period = ch.inst.periodForNote(note, ch.fine);
    }
  }

  eff_t0_1(ch, data) {  // pitch slide up
    if (data !== 0) {
      ch.slideupspeed = data * 4;
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
      ch.slidedownspeed = data * 4;
    }
  }

  eff_t1_2(ch) {  // pitch slide down
    if (ch.slidedownspeed !== undefined) {
      // 6912 is the period for C-1
      ch.period = Math.min(6912, ch.period + ch.slidedownspeed);
    }
  }

  eff_t0_3(ch, data) {  // portamento
    if (data !== 0) {
      ch.portaspeed = data * 4;
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
      console.log('vibrato periodoffset NaN?',
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
    let delta = 0;
    switch (type & 0x03) {
      case 1: // sawtooth (ramp-down)
        delta = ((1 + ((x * 2) / 64)) % 2) - 1;
        break;
      case 2: // square
      case 3: // random (in FT2 these two are the same)
        delta = x < 32 ? 1 : -1;
        break;
      case 0:
      default: // sine
        delta = Math.sin((x * Math.PI) / 32);
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
    if (this.cyclePattern == null) {
      if (data < song.getSequenceLength()) {
        this.cur_songpos = data;
        this.setCurrentPattern();
        this.cur_row = 0;
      }
    } else {
      this.cur_row = 0;
    }
  }

  eff_t0_c(ch, data) {  // set volume
    ch.vol = Math.min(64, data);
  }

  eff_t0_d(ch, data) {  // pattern jump
    if (this.cyclePattern == null) {
      this.jump_songpos = this.cur_songpos + 1;
      if (this.jump_songpos >= song.getSequenceLength()) {
        this.jump_songpos = song.getLoopPosition();
      }
      this.jump_pat = song.getSequencePatternNumber(this.jump_songpos);
    } else {
      this.jump_songpos = this.cur_songpos;
      this.jump_pat = this.cur_pat;
    }
    this.jump_row = ((data >> 4) * 10) + (data & 0x0f);
  }

  eff_t0_e(ch, data) {  // extended effects!
    const eff = data >> 4;
    let dataP = data & 0x0f;
    switch (eff) {
      case 1:  // fine porta up
        ch.period -= dataP;
        break;
      case 2:  // fine porta down
        ch.period += dataP;
        break;
      case 4:  // set vibrato waveform
        ch.vibratotype = dataP & 0x07;
        break;
      case 5:  // finetune
        ch.fine = ((dataP << 4) + dataP) - 128;
        break;
      case 8:  // panning
        ch.pan = dataP * 0x11;
        break;
      case 0x0a:  // fine vol slide up (with memory)
        if (dataP === 0 && ch.finevolup !== undefined) {
          dataP = ch.finevolup;
        }
        ch.vol = Math.min(64, ch.vol + dataP);
        ch.finevolup = dataP;
        break;
      case 0x0b:  // fine vol slide down
        if (dataP === 0 && ch.finevoldown !== undefined) {
          dataP = ch.finevoldown;
        }
        ch.vol = Math.max(0, ch.vol - dataP);
        ch.finevoldown = dataP;
        break;
      case 0x0c:  // note cut handled in eff_t1_e
        break;
      default:
        throw Error(`Unimplemented extended effect E ${ch.effectdata.toString(16)}`);
    }
  }

  eff_t1_e(ch) {  // note cut
    switch (ch.effectdata >> 4) {
      case 0x0c:
        if (this.cur_tick === (ch.effectdata & 0x0f)) {
          ch.vol = 0;
        }
        break;
      default:
        break;
    }
  }

  eff_t0_f(ch, data) {  // set tempo
    if (data === 0) {
      console.log('tempo 0?');
      return;
    } if (data < 0x20) {
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

  eff_t1_h() {  // global volume slide
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
      default: break;
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
    throw Error(`Unimplemented effect ${ch.effect} ${data}`);
  }
}
/* eslint-enable camelcase, no-param-reassign, no-bitwise */

export const player = new Player();
