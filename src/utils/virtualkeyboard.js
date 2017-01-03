import $ from 'jquery';
import Signal from '../utils/signal';

import { song } from './songmanager';
import { state } from '../state';
import { player } from '../audio/player';
import { cursor } from '../utils/cursor';

class VirtualKeyboard {
  constructor() {
    this.validKeys = [
      "z", "s", "x", "d", "c", "v", "g", "b", "h", "n", "j", "m", ",", "l", ".", ";", "/", 
      "q", "2", "w", "3", "e", "r", "5", "t", "6", "y", "7", "u", "i", "9", "o", "0", "p", "[", "=", "]",
      "`",
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

    this.paused = false;

    this.keys = {};
    this.playing = {};

    window.addEventListener("keydown", this.handleKeyDown.bind(this));
    window.addEventListener("keyup", this.handleKeyUp.bind(this));

    this.noteDown = Signal.signal(false);
    this.noteUp = Signal.signal(false);
  }

  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
  }

  handleKeyDown(event) {
    if (this.paused) {
      return;
    }

    if ($(event.target).is(":input")) {
      return;
    }

    if (event.ctrlKey || event.shiftKey || event.metaKey ) {
      return;
    }

    if (this.keys[event.keyCode] > 0) {
      return; 
    }
    this.keys[event.keyCode] = event.timeStamp || (new Date()).getTime();

    if (state.cursor.get("record")) {
      if (state.cursor.get("item") !== 0) {
        return;
      }
      const current_octave = state.transport.get("octave"); 
      if (event.key in this.mappingTable) {
        song.addNoteToSong(state.cursor.toJS(), this.mappingTable[event.key] + (12 * current_octave), state.cursor.get("instrument") + 1); 
        cursor.rowDown(state.transport.get("step"));
      } else {
        if (event.key == '`') {
          song.addNoteToSong(state.cursor.toJS(), 96);
        }
      }
    } else {
      // Trigger note immediately if a VK note
      if (event.key in this.mappingTable) {
        const current_octave = state.transport.get("octave"); 
        if (event.key in this.playing && this.playing[event.key] != null) {
          player.stopInteractiveInstrument(this.playing[event.key]);
          delete this.playing[event.key];
        }
        const note = this.mappingTable[event.key] + (12 * current_octave);
        this.playing[event.key] = player.playNoteOnCurrentChannel(note, (instrument) => {
          player.stopInteractiveInstrument(instrument);
          if (this.playing[event.key] === instrument) {
            delete this.playing[event.key];
          }
        });
        this.noteDown(note);

        //event.preventRepeat();
      }
    }
  }

  handleKeyUp(event) {
    if (this.paused) {
      return;
    }

    if (event.ctrlKey || event.shiftKey || event.metaKey ) {
      return false;
    }

    this.keys[event.keyCode] = 0;

    if (!state.cursor.get("record")) {
      // Trigger note immediately if a VK note
      if (event.key in this.mappingTable) {
        if (event.key in this.playing && this.playing[event.key] != null) {
          player.releaseInteractiveInstrument(this.playing[event.key]);
        }
        const current_octave = state.transport.get("octave"); 
        const note = this.mappingTable[event.key] + (12 * current_octave);
        this.noteUp(note);
      }
    }
    return false;
  }
}

export let virtualKeyboard = new VirtualKeyboard(); 
  
