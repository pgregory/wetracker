import Signal from '../utils/signal';
import KeyboardJS from 'keyboardjs';

import { song } from './songmanager';
import { state } from '../state';
import { cursor } from '../utils/cursor';

export class VirtualKeyboard {
  constructor() {
    this.validKeys = [
      "z", "s", "x", "d", "c", "v", "g", "b", "h", "n", "j", "m", ",", "l", ".", ";", "/", 
      "q", "2", "w", "3", "e", "r", "5", "t", "6", "y", "7", "u", "i", "9", "o", "0", "p", "[", "=", "]",
    ];
    this.mappingTable = {
      "z": 0,   // C-0
      "s": 1,   // C#0
      "x": 2,   // D-0
      "d": 3,   // D#0
      "c": 4,   // E-0
      "v": 5,   // F-0
      "g": 6,   // F#0
      "b": 7,   // G-0
      "h": 8,   // G#0
      "n": 9,   // A-0
      "j": 10,  // A#0
      "m": 11,  // B-0
      ",": 12,  // C-1
      "l": 13,  // C#1
      ".": 14,  // D-1
      ";": 15,  // D#1
      "/": 16,  // E-1
      "q": 12,  // C-1
      "2": 13,  // C#1
      "w": 14,  // D-1
      "3": 15,  // D#1
      "e": 16,  // E-1
      "r": 17,  // F-1
      "5": 18,  // F#1
      "t": 19,  // G-1
      "6": 20,  // G#1
      "y": 21,  // A-1
      "7": 22,  // A#1
      "u": 23,  // B-1
      "i": 24,  // C-2
      "9": 25,  // C#2
      "o": 26,  // D-2
      "0": 27,  // D#2
      "p": 28,  // E-2
      "[": 29,  // F-2
      "=": 30,  // F#2
      "]": 31,  // G-2
    };

    KeyboardJS.bind(this.validKeys, (e) => {
      this.handleKeyDown(e);
    }, (e) => {
      this.handleKeyUp(e);
    });
  }

  handleKeyDown(event) {
    if (event.ctrlKey || event.shiftKey || event.metaKey ) {
      return;
    }
    if (state.cursor.get("record")) {
      if (state.cursor.get("item") !== 0) {
        return;
      }
      const current_octave = state.transport.get("octave"); 
      if (event.key in this.mappingTable) {
        song.addNoteToSong(state.cursor.toJS(), this.mappingTable[event.key] + (12 * current_octave), state.cursor.get("instrument") + 1); 
        cursor.rowDown(state.transport.get("step"));
      }
    } 
  }

  handleKeyUp(event) {
    if (event.ctrlKey || event.shiftKey || event.metaKey ) {
      return false;
    }
    var current_octave = state.transport.get("octave"); 
    if (event.key in this.mappingTable) {
      song.addNoteToSong(state.cursor.toJS(), this.mappingTable[event.key] + (12 * current_octave), state.cursor.get("instrument") + 1); 
      return true;
    }
    return false;
  }
}

export let virtualKeyboard = new VirtualKeyboard(); 
  
