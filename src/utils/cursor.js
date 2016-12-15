import Signal from './signal';
import KeyboardJS from 'keyboardjs';

import { state } from '../state';
import { song } from './songmanager';

const items = [
  'note',
  'instrument_h',
  'instrument_l',
  'volume_h',
  'volume_l',
  'fxtype_h',
  'fxtype_l',
  'fxparam_h',
  'fxparam_l',
];

export class CursorManager {
  constructor() {
    KeyboardJS.bind("down", (e) => {
      this.rowDown();
      e.preventDefault();
    });
    KeyboardJS.bind("up", (e) => {
      this.rowUp();
      e.preventDefault();
    });
    KeyboardJS.bind("right", (e) => {
      this.itemRight();
      e.preventDefault();
    });
    KeyboardJS.bind("left", (e) => {
      this.itemLeft();
      e.preventDefault();
    });
    KeyboardJS.bind("backspace", (e) => {
      if (e.ctrlKey || e.shiftKey || e.metaKey ) {
        return;
      }
      song.deleteItemAtCursor(state.cursor.toJS());
      event.preventDefault();
    });
  }

  rowUp(count = 1) {
    let row = state.cursor.get("row") - count;
    if (row < 0) {
      row = song.song.patterns[state.cursor.get("pattern")].numrows + row;
    }
    state.set({
      cursor: {
        row,
      }
    });
  }

  rowDown(count = 1) {
    let row = state.cursor.get("row") + count;
    if (row >= song.song.patterns[state.cursor.get("pattern")].numrows) {
      row = 0 + (row - song.song.patterns[state.cursor.get("pattern")].numrows);
    }
    state.set({
      cursor: {
        row,
      }
    });
  }

  itemLeft() {
    let item = state.cursor.get("item");
    let track = state.cursor.get("track");
    let column = state.cursor.get("column");
    item -= 1;
    if (item < 0 ) {
      item = items.length-1; 
      column -= 1;
      if (column < 0) {
        track -= 1;
        if (track < 0) {
          track = song.song.tracks.length - 1;
        }
        column = song.song.tracks[track].columns.length - 1;
      }
    }
    state.set({
      cursor: {
        track,
        column,
        item, 
      }
    });
  }

  itemRight() {
    let item = state.cursor.get("item");
    let track = state.cursor.get("track");
    let column = state.cursor.get("column");
    item += 1;
    if (item >= items.length ) {
      item = 0; 
      // Next notecolumn
      column += 1;
      if (column >= song.song.tracks[track].columns.length) {
        column = 0;
        track += 1;
        if (track >= song.song.tracks.length) {
          track = 0;
        }
      }
    }
    state.set({
      cursor: {
        track,
        column,
        item, 
      }
    });
  }
}

export let cursor = new CursorManager(); 

