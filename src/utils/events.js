import { song } from './songmanager';
import { state } from '../state';
import { player } from '../audio/player';
import { cursor } from './cursor';

class EventSystem {
  constructor() {
    this.keys = {};
    this.playing = {};

    this.events = {
      noteDown: (args) => {
        const noteConfig = args[0];
        const currentOctave = state.transport.get('octave');
        let { note } = noteConfig;
        note += noteConfig.special ? 0 : (12 * currentOctave);

        if (state.cursor.get('record')) {
          if (state.cursor.get('item') !== 0) {
            return;
          }
          state.groupHistoryStart('Play note into pattern');
          if (noteConfig.special) {
            song.addNoteToSong(state.cursor.toJS(), note);
          } else {
            song.addNoteToSong(state.cursor.toJS(), note, state.cursor.get('instrument') + 1);
          }
          state.groupHistoryEnd();
          if (!player.playing) {
            cursor.rowDown(state.transport.get('step'));
          }
        }
        if (!noteConfig.special) {
          // Trigger note immediately if a VK note
          if (noteConfig.note in this.playing && this.playing[noteConfig.note] != null) {
            player.stopInteractiveInstrument(this.playing[noteConfig.note]);
            delete this.playing[noteConfig.note];
          }
          this.playing[noteConfig.note] = player.playNoteOnCurrentChannel(note, (instrument) => {
            player.stopInteractiveInstrument(instrument);
            if (this.playing[noteConfig.note] === instrument) {
              delete this.playing[noteConfig.note];
            }
          });
          // this.noteDown(note);
        }
      },
      noteUp: (args) => {
        const noteConfig = args[0];
        if (!state.cursor.get('record')) {
          // If not recording, and a note is playing that matches, stop it.
          if (noteConfig.note in this.playing && this.playing[noteConfig.note] != null) {
            player.releaseInteractiveInstrument(this.playing[noteConfig.note]);
          }
          // const currentOctave = state.transport.get('octave');
          // let { note } = noteConfig;
          // note += noteConfig.special ? 0 : (12 * currentOctave);
          // this.noteUp(note);

          return true;
        }
        return false;
      },
    };
  }

  raise(eventName, ...args) {
    if (eventName in this.events) {
      this.events[eventName](args);
    }
  }
}

export const eventSystem = new EventSystem();
