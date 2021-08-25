import $ from 'jquery';
import { signal } from './signal';
import { eventSystem } from './events';
import { state } from '../state';

class VirtualKeyboard {
  constructor() {
    this.validKeys = [
      'z', 's', 'x', 'd', 'c', 'v', 'g', 'b', 'h', 'n', 'j', 'm', ',', 'l', '.', ';', '/',
      'q', '2', 'w', '3', 'e', 'r', '5', 't', '6', 'y', '7', 'u', 'i', '9', 'o', '0', 'p', '[', '=', ']',
      '`',
    ];
    this.mappingTable = {
      z: { note: 0, special: false },  // C-0
      s: { note: 1, special: false },   // C#0
      x: { note: 2, special: false },   // D-0
      d: { note: 3, special: false },   // D#0
      c: { note: 4, special: false },   // E-0
      v: { note: 5, special: false },   // F-0
      g: { note: 6, special: false },   // F#0
      b: { note: 7, special: false },   // G-0
      h: { note: 8, special: false },   // G#0
      n: { note: 9, special: false },   // A-0
      j: { note: 10, special: false },  // A#0
      m: { note: 11, special: false },  // B-0
      ',': { note: 12, special: false },  // C-1
      l: { note: 13, special: false },  // C#1
      '.': { note: 14, special: false },  // D-1
      ';': { note: 15, special: false },  // D#1
      '/': { note: 16, special: false },  // E-1
      q: { note: 12, special: false },  // C-1
      2: { note: 13, special: false },  // C#1
      w: { note: 14, special: false },  // D-1
      3: { note: 15, special: false },  // D#1
      e: { note: 16, special: false },  // E-1
      r: { note: 17, special: false },  // F-1
      5: { note: 18, special: false },  // F#1
      t: { note: 19, special: false },  // G-1
      6: { note: 20, special: false },  // G#1
      y: { note: 21, special: false },  // A-1
      7: { note: 22, special: false },  // A#1
      u: { note: 23, special: false },  // B-1
      i: { note: 24, special: false },  // C-2
      9: { note: 25, special: false },  // C#2
      o: { note: 26, special: false },  // D-2
      0: { note: 27, special: false },  // D#2
      p: { note: 28, special: false },  // E-2
      '[': { note: 29, special: false },  // F-2
      '=': { note: 30, special: false },  // F#2
      ']': { note: 31, special: false },  // G-2
      '`': { note: 96, special: true },  // stop
    };

    this.paused = false;

    this.keys = {};

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    this.noteDown = signal(false);
    this.noteUp = signal(false);
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

    if ($(event.target).is(':input') && ($(event.target).attr('type') === 'text')) {
      return;
    }

    if (event.ctrlKey || event.shiftKey || event.metaKey) {
      return;
    }

    if (this.keys[event.keyCode] > 0) {
      return;
    }
    this.keys[event.keyCode] = event.timeStamp || (new Date()).getTime();

    if (event.key in this.mappingTable) {
      const currentOctave = state.transport.get('octave');
      const { noteA, special } = this.mappingTable[event.key];
      const note = noteA + special ? 0 : (12 * currentOctave);
      this.noteDown(note);
      eventSystem.raise('noteDown', note);
    }
  }

  handleKeyUp(event) {
    if (this.paused) {
      return false;
    }

    if (event.ctrlKey || event.shiftKey || event.metaKey) {
      return false;
    }

    this.keys[event.keyCode] = 0;

    if (event.key in this.mappingTable) {
      const currentOctave = state.transport.get('octave');
      const { noteA, special } = this.mappingTable[event.key];
      const note = noteA + special ? 0 : (12 * currentOctave);
      this.noteUp(note);
      eventSystem.raise('noteUp', note);
      return true;
    }
    return false;
  }
}

export const virtualKeyboard = new VirtualKeyboard();
