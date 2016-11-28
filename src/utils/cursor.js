import Signal from './signal';
import { state } from '../state';
import { song } from './songmanager';

export class CursorManager {
  rowUp(count = 1) {
    let row = state.cursor.get("row") - count;
    if (row < 0) {
      row = song.song.patterns['p1'].rows + row;
    }
    state.set({
      cursor: {
        row,
      }
    });
  }

  rowDown(count = 1) {
    let row = state.cursor.get("row") + count;
    if (row >= song.song.patterns['p1'].rows) {
      row = 0 + (row - song.song.patterns['p1'].rows);
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
      item = 5; 
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
    if (item > 5 ) {
      item = 0; 
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

