import Signal from '../utils/signal';

import { song } from './songmanager';
import { state } from '../state';

export class VirtualKeyboard {
  constructor() {
    this.mappingTable = {
      "z": 0,   // C-
      "s": 1,   // C#
      "x": 2,   // D
      "d": 3,   // D#
      "c": 4,   // E
      "v": 5,   // F
      "g": 6,   // F#
      "b": 7,   // G
      "h": 8,   // G#
      "n": 9,   // A
      "j": 10,  // A#
      "m": 11,  // B
    };
  }

  handleKeyAtCursor(event) {
    var current_octave = 4; // Note: should get this from the state soon.
    if (event.key in this.mappingTable) {
      song.addNoteToSong(state.cursor.toJS(), this.mappingTable[event.key] + (12 * current_octave), state.cursor.get("instrument") + 1); 
      return true;
    }
    return false;
  }
}

export let virtualKeyboard = new VirtualKeyboard(); 
  
