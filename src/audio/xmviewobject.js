import { state } from '../state';
import { song } from '../utils/songmanager';

export default class XMViewObject {
  constructor(player) {
    this.audioEvents = [];
    this.pausedEvents = [];
    this.shownRow = undefined;
    this.shownPat = undefined;
    this.shown_sequence = undefined;

    this.player = player;

    this.redrawScreen = this.redrawScreen.bind(this);
  }

  pause() {
    // grab all the audio events
    const t = this.player.audioctx.currentTime;
    while (this.audioEvents.length > 0) {
      const e = this.audioEvents.shift();
      e.t -= t;
      this.pausedEvents.push(e);
    }
  }

  resume() {
    const t = this.player.audioctx.currentTime;
    while (this.pausedEvents.length > 0) {
      const e = this.pausedEvents.shift();
      e.t += t;
      this.audioEvents.push(e);
    }
    window.requestAnimationFrame(this.redrawScreen);
  }

  stop() {
    this.audioEvents = [];
    this.pausedEvents = [];
  }

  start() {
    window.requestAnimationFrame(this.redrawScreen);
  }

  pushEvent(e) {
    this.audioEvents.push(e);
    if (this.audioEvents.length === 1 || e.t === -1) {
      window.requestAnimationFrame(this.redrawScreen);
    }
  }

  redrawScreen() {
    let e;
    const t = this.player.audioctx.currentTime;
    while (this.audioEvents.length > 0 && this.audioEvents[0].t <= t) {
      e = this.audioEvents.shift();
    }
    if (!e) {
      if (this.player.playing || this.player.playingInteractive) {
        window.requestAnimationFrame(this.redrawScreen);
      }
      return;
    }

    if (!state.cursor.get('saveStream')) {
      if ('row' in e && 'pat' in e) {
        if (e.row !== this.shownRow
           || e.pat !== this.shownPat) {
          state.set({
            cursor: {
              row: e.row,
              pattern: e.pat,
              sequence: e.songpos,
            },
          });
          this.shownRow = e.row;
          this.shownPat = e.pat;
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
          freqData: ch.analyserScopeData,
          bufferLength: ch.analyserBufferLength,
        });

        states.push(ch.getState());
      }

      this.player.updateMasterAnalyserScopeData();
      const masterScope = {
        scopeData: this.player.masterAnalyserScopeData,
        freqData: this.player.masterAnalyserFreqData,
        bufferLength: this.player.masterAnalyserBufferLength,
      };

      this.player.tracksChanged({
        t: e.t,
        vu: e.vu,
        scopes,
        states,
        masterScope,
      });

      const positions = [];
      for (let i = 0; i < this.player.playingInstruments.length; i += 1) {
        const pInstr = this.player.playingInstruments[i];
        if (!pInstr.release) {
          if (pInstr.instrument.instrumentIndex > positions.length || positions[pInstr.instrument.instrumentIndex] == null) {
            positions[pInstr.instrument.instrumentIndex] = [];
          }
          positions[pInstr.instrument.instrumentIndex].push({
            instrument: pInstr,
            position: pInstr.getCurrentPosition(),
          });
        }
      }
      state.set({
        playingInstruments: {
          positions,
        },
      });
    } else if ('songpos' in e) {
      if (e.songpos !== this.shown_sequence) {
        state.set({
          cursor: {
            recordSequence: e.songpos,
          },
        });
        this.shown_sequence = e.songpos;
      }
    }

    if (this.player.playing || this.player.playingInteractive) {
      window.requestAnimationFrame(this.redrawScreen);
    }
  }
}
