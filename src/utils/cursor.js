import Signal from './signal';
import MouseTrap from 'mousetrap';

import { state } from '../state';
import { song } from './songmanager';

const items = [
  'note',
  'instrument_h',
  'instrument_l',
  'volume_h',
  'volume_l',
  'fxtype_h',
  'fxparam_h',
  'fxparam_l',
];

export class CursorManager {
  constructor() {
    MouseTrap.bind("down", (e) => {
      this.rowDown();
      e.preventDefault();
    });
    MouseTrap.bind("up", (e) => {
      this.rowUp();
      e.preventDefault();
    });
    MouseTrap.bind("right", (e) => {
      this.itemRight();
      e.preventDefault();
    });
    MouseTrap.bind("left", (e) => {
      this.itemLeft();
      e.preventDefault();
    });
    MouseTrap.bind("backspace", (e) => {
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
      row = song.getPatternRowCount(state.cursor.get("pattern")) + row;
    }
    state.set({
      cursor: {
        row,
      }
    });
  }

  rowDown(count = 1) {
    let row = state.cursor.get("row") + count;
    const numrows = song.getPatternRowCount(state.cursor.get("pattern"));
    if (row >= numrows) {
      row = 0 + (row - numrows);
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
          track = song.getNumTracks() - 1;
        }
        column = song.getTrackNumColumns(track) - 1;
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
      if (column >= song.getTrackNumColumns(track)) {
        column = 0;
        track += 1;
        if (track >= song.getNumTracks()) {
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

