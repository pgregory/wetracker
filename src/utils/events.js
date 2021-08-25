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
        const note = args[0];

        if (state.cursor.get('record')) {
          if (state.cursor.get('item') !== 0) {
            return;
          }
          state.groupHistoryStart('Play note into pattern');
          const instrument = note >= 96 ? null : state.cursor.get('instrument') + 1;
          song.addNoteToSong(state.cursor.toJS(), note, instrument);
          state.groupHistoryEnd();
          if (!player.playing) {
            cursor.rowDown(state.transport.get('step'));
          }
        }
        if (note < 96) {
          // Trigger note immediately if a VK note
          if (note in this.playing && this.playing[note] != null) {
            player.stopInteractiveInstrument(this.playing[note]);
            delete this.playing[note];
          }
          this.playing[note] = player.playNoteOnCurrentChannel(note, (instrument) => {
            player.stopInteractiveInstrument(instrument);
            if (this.playing[note] === instrument) {
              delete this.playing[note];
            }
          });
          // this.noteDown(note);
        }
      },
      noteUp: (args) => {
        const note = args[0];
        if (note < 96) {
          if (!state.cursor.get('record')) {
            // If not recording, and a note is playing that matches, stop it.
            if (note in this.playing && this.playing[note] != null) {
              player.releaseInteractiveInstrument(this.playing[note]);
            }
            // const currentOctave = state.transport.get('octave');
            // let { note } = noteConfig;
            // note += noteConfig.special ? 0 : (12 * currentOctave);
            // this.noteUp(note);

            return true;
          }
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
