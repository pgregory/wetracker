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

import * as constants from './constants';

/**
 * Move the pattern cursor one step to the right
 *
 * @return {object} An action object with a type of CURSOR_RIGHT
 */
export function cursorRight(tracks) {
  return {
    type: constants.CURSOR_RIGHT,
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
    type: constants.CURSOR_LEFT,
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
    type: constants.CURSOR_TRACK_RIGHT,
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
    type: constants.CURSOR_TRACK_LEFT,
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
    type: constants.CURSOR_UP,
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
    type: constants.CURSOR_DOWN,
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
    type: constants.CURSOR_SET_ROW,
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
    type: constants.CURSOR_SET_TRACK_ITEM,
    track,
    item,
  };
}

export function setNoteAtCursor(cursor, note) {
  return {
    type: constants.SET_NOTE_AT_CURSOR,
    cursor,
    note,
  };
}

export function saveSong() {
  return {
    type: constants.SAVE_SONG,
  };
}

export function loadSong() {
  return {
    type: constants.LOAD_SONG,
  };
}

export function doneRefresh() {
  return {
    type: constants.DONE_REFRESH,
  };
}

export function play() {
  return {
    type: constants.PLAY,
  };
}

export function stop() {
  return {
    type: constants.STOP,
  };
}

export function playCursorSetRow(row, patternRows = 64) {
  return {
    type: constants.PLAY_CURSOR_SET_ROW,
    row,
    patternRows,
  };
}


export function stepChange(step) {
  return {
    type: constants.STEP_CHANGE,
    step,
  };
}

export function octaveChange(octave) {
  return {
    type: constants.OCTAVE_CHANGE,
    octave,
  };
}
