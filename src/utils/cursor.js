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
    MouseTrap.bind(["down", "shift+down"], (e) => {
      const selectMode = e.shiftKey;
      this.rowDown(1, selectMode);
      e.preventDefault();
    });
    MouseTrap.bind(["up", "shift+up"], (e) => {
      const selectMode = e.shiftKey;
      this.rowUp(1, selectMode);
      e.preventDefault();
    });
    MouseTrap.bind(["right", "shift+right"], (e) => {
      const selectMode = e.shiftKey;
      this.itemRight(selectMode);
      e.preventDefault();
    });
    MouseTrap.bind(["left", "shift+left"], (e) => {
      const selectMode = e.shiftKey;
      this.itemLeft(selectMode);
      e.preventDefault();
    });
    MouseTrap.bind("del", (e) => {
      if (state.cursor.get("record")) {
        if (e.ctrlKey || e.shiftKey || e.metaKey ) {
          return;
        }
        song.deleteItemAtCursor(state.cursor.toJS());
        event.preventDefault();
      }
    });
    MouseTrap.bind("backspace", (e) => {
      if(state.cursor.get("record") && state.cursor.get("row") > 0) {
        if (e.ctrlKey || e.shiftKey || e.metaKey ) {
          return;
        }
        song.deleteRow(state.cursor.get("row") - 1);
        state.set({
          cursor: {
            row: state.cursor.get("row") - 1,
          }
        });
        event.preventDefault();
      }
    });
  }

  storeStartCursor() {
    if (!(state.cursor.get("selecting"))) {
      state.set({
        cursor: {
          row_start: state.cursor.get("row"),
          track_start: state.cursor.get("track"),
          column_start: state.cursor.get("column"),
          item_start: state.cursor.get("item"),
          selecting: true,
        }
      });
    }
  }

  resetStartCursor() {
    state.set({
      cursor: {
        row_start: state.cursor.get("row"),
        track_start: state.cursor.get("track"),
        column_start: state.cursor.get("column"),
        item_start: state.cursor.get("item"),
        selecting: false,
      }
    });
  }

  rowUp(count, selectMode) {
    let row = state.cursor.get("row") - count;
    if (row < 0) {
      row = song.getPatternRowCount(state.cursor.get("pattern")) + row;
    }
    if (selectMode) {
      this.storeStartCursor();
    } 
    state.set({
      cursor: {
        row,
      }
    });
    if (!selectMode) {
      this.resetStartCursor();
    }
  }

  rowDown(count, selectMode) {
    let row = state.cursor.get("row") + count;
    const numrows = song.getPatternRowCount(state.cursor.get("pattern"));
    if (row >= numrows) {
      row = 0 + (row - numrows);
    }
    if (selectMode) {
      this.storeStartCursor();
    }
    state.set({
      cursor: {
        row,
      }
    });
    if (!selectMode) {
      this.resetStartCursor();
    }
  }

  itemLeft(selectMode) {
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
    if (selectMode) {
      this.storeStartCursor();
    }
    state.set({
      cursor: {
        track,
        column,
        item, 
      }
    });
    if (!selectMode) {
      this.resetStartCursor();
    }
  }

  itemRight(selectMode) {
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
    if (selectMode) {
      this.storeStartCursor();
    }
    state.set({
      cursor: {
        track,
        column,
        item, 
      }
    });
    if (!selectMode) {
      this.resetStartCursor();
    }
  }
}

export let cursor = new CursorManager(); 

