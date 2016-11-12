/*
 * App Actions
 *
 * Actions change things in your application
 * Since this boilerplate uses a uni-directional data flow, specifically redux,
 * we have these actions which are the only way your application interacts with
 * your application state. This guarantees that your state is up to date and nobody
 * messes it up weirdly somewhere.
 *
 * To add a new Action:
 * 1) Import your constant
 * 2) Add a function like this:
 *    export function yourAction(var) {
 *        return { type: YOUR_ACTION_CONSTANT, var: var }
 *    }
 */

import {
  CURSOR_RIGHT,
  CURSOR_LEFT,
  CURSOR_UP,
  CURSOR_DOWN,
  CURSOR_SET_ROW,
  CURSOR_SET_TRACK_ITEM,
  SET_NOTE_AT_CURSOR,
  CURSOR_TRACK_RIGHT,
  CURSOR_TRACK_LEFT,
  SAVE_SONG,
  LOAD_SONG,
  DONE_REFRESH,
} from './constants';

/**
 * Move the pattern cursor one step to the right
 *
 * @return {object} An action object with a type of CURSOR_RIGHT
 */
export function cursorRight(tracks) {
  return {
    type: CURSOR_RIGHT,
    step: 1,
    tracks,
  };
}

/**
 * Move the pattern cursor one step to the left
 *
 * @return {object} An action object with a type of CURSOR_LEFT
 */
export function cursorLeft(tracks) {
  return {
    type: CURSOR_LEFT,
    step: 1,
    tracks,
  };
}

/**
 * Move the pattern cursor one track to the right
 *
 * @return {object} An action object with a type of CURSOR_TRACK_RIGHT
 */
export function cursorTrackRight(tracks) {
  return {
    type: CURSOR_TRACK_RIGHT,
    step: 1,
    tracks,
  };
}

/**
 * Move the pattern cursor one track to the left
 *
 * @return {object} An action object with a type of CURSOR_TRACK_LEFT
 */
export function cursorTrackLeft(tracks) {
  return {
    type: CURSOR_TRACK_LEFT,
    step: 1,
    tracks,
  };
}

/**
 * Move the pattern cursor one row up
 *
 * @return {object} An action object with a type of CURSOR_UP
 */
export function cursorUp(step = 1, patternRows = 64) {
  return {
    type: CURSOR_UP,
    step,
    patternRows,
  };
}

/**
 * Move the pattern cursor one row down
 *
 * @return {object} An action object with a type of CURSOR_DOWN
 */
export function cursorDown(step = 1, patternRows = 64) {
  return {
    type: CURSOR_DOWN,
    step,
    patternRows,
  };
}

/**
 * Move the pattern cursor to a specified row
 *
 * @return {object} An action object with a type of CURSOR_SET_ROW
 */
export function cursorSetRow(row, patternRows = 64) {
  return {
    type: CURSOR_SET_ROW,
    row,
    patternRows,
  };
}

/**
 * Move the pattern cursor to a specified row
 *
 * @return {object} An action object with a type of CURSOR_SET_ROW
 */
export function cursorSetTrackItem(track, item) {
  return {
    type: CURSOR_SET_TRACK_ITEM,
    track,
    item,
  };
}

export function setNoteAtCursor(cursor, note) {
  return {
    type: SET_NOTE_AT_CURSOR,
    cursor,
    note,
  };
}

export function saveSong() {
  return {
    type: SAVE_SONG,
  };
}

export function loadSong() {
  return {
    type: LOAD_SONG,
  };
}

export function doneRefresh() {
  return {
    type: DONE_REFRESH,
  };
}
