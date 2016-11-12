/**
 * Combine all reducers in this file and export the combined reducers.
 * If we were to do this in store.js, reducers wouldn't be hot reloadable.
 */

import { combineReducers } from 'redux-immutable';
import { fromJS } from 'immutable';
import { LOCATION_CHANGE } from 'react-router-redux';
import * as constants from 'containers/App/constants';
import languageProviderReducer from 'containers/LanguageProvider/reducer';

/*
 * routeReducer
 *
 * The reducer merges route location changes into our immutable state.
 * The change is necessitated by moving to react-router-redux@4
 *
 */

// Initial routing state
const routeInitialState = fromJS({
  locationBeforeTransitions: null,
});

/**
 * Merge route into the global application state
 */
function routeReducer(state = routeInitialState, action) {
  switch (action.type) {
    /* istanbul ignore next */
    case LOCATION_CHANGE:
      return state.merge({
        locationBeforeTransitions: action.payload,
      });
    default:
      return state;
  }
}

const cursorInitialState = fromJS({
  row: 0,
  track: 0,
  item: 0,
  play_row: 0,
});

function cursorReducer(state = cursorInitialState, action) {
  switch (action.type) {
    case constants.CURSOR_UP: {
      let t = state.get('row') - action.step;
      if (t < 0) {
        t = action.patternRows - 1;
      }
      return state.merge({
        row: t,
      });
    }
    case constants.CURSOR_DOWN: {
      let t = state.get('row') + action.step;
      if (t >= action.patternRows) {
        t = 0;
      }
      return state.merge({
        row: t,
      });
    }
    case constants.CURSOR_LEFT: {
      let i = state.get('item') - action.step;
      let t = state.get('track');
      if (i < 0) {
        i = 5;
        t -= 1;
        if (t < 0) {
          t = action.tracks.length - 1;
        }
      }
      return state.merge({
        item: i,
        track: t,
      });
    }
    case constants.CURSOR_RIGHT: {
      let i = state.get('item') + action.step;
      let t = state.get('track');
      if (i > 5) {
        i = 0;
        t += 1;
        if (t >= action.tracks.length) {
          t = 0;
        }
      }
      return state.merge({
        item: i,
        track: t,
      });
    }
    case constants.CURSOR_TRACK_LEFT: {
      let t = state.get('track') - action.step;
      if (t < 0) {
        t = action.tracks.length - 1;
      }
      return state.merge({
        track: t,
      });
    }
    case constants.CURSOR_TRACK_RIGHT: {
      let t = state.get('track') + action.step;
      if (t >= action.tracks.length) {
        t = 0;
      }
      return state.merge({
        track: t,
      });
    }
    case constants.CURSOR_SET_ROW:
      return state.merge({
        row: action.row,
      });
    case constants.PLAY_CURSOR_SET_ROW:
      return state.merge({
        play_row: action.row,
        row: action.row,
      });
    case constants.CURSOR_SET_TRACK_ITEM:
      return state.merge({
        track: action.track,
        item: action.item,
      });
    default:
      return state;
  }
}

const songInitialState = fromJS({
  tracks: [
    { name: 'Bass' },
    { name: 'Drums' },
    { name: 'Lead' },
    { name: 'Pad' },
    { name: 'Track 5' },
    { name: 'Track 6' },
  ],
  instruments: [
  ],
  patterns: [{
    rows: 64,
    trackdata: [
/*        [
  { note: 'E4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  { note: 'D#5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  { note: 'D#5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  { note: 'B4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  { note: 'D5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  { note: 'C5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  { note: 'A2', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  { note: 'E4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  {},
  {},
  { note: 'E2', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  { note: 'G#4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  {},
  {},
  { note: 'A2', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  { note: 'D#5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  { note: 'D#5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  { note: 'B4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  { note: 'D5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  { note: 'C5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
        ],
        [
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  { note: 'A4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  {},
  {},
  { note: 'A3', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  {},
  {},
  {},
  {},
  { note: 'A4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  { note: 'B4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  {},
  {},
  { note: 'G#3', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  {},
  {},
  {},
  {},
  { note: 'B4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  { note: 'C5', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  {},
  {},
  { note: 'A3', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
        ],
        [
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  { note: 'E3', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
 },
  {},
  { note: 'E3', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
 },
  {},
  { note: 'E3', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  {},
  {},
  {},
  {},
  {},
  {},
 },
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
        ],
        [
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  { note: 'C4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  {},
  {},
  {},
  {},
 },
  {},
  {},
  {},
  {},
  {},
  { note: 'E4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  {},
  {},
  {},
  {},
 },
  {},
  {},
  {},
  {},
  {},
  { note: 'E4', instrument: 1, volume: 40, panning: 80, delay: 0 },
  {},
  {},
  {},
 },
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
        ],
        [
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
        ],
        [
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
  {},
        ],
*/

      [
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
      ],
      [
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
      ],
      [
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
      ],
      [
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
      ],
      [
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
      ],
      [
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
      ],
    ],
  }],
});

const keyToNote = {
  z: { note: 'C', octave: 0 },
  x: { note: 'D', octave: 0 },
  c: { note: 'E', octave: 0 },
  v: { note: 'F', octave: 0 },
  b: { note: 'G', octave: 0 },
  n: { note: 'A', octave: 0 },
  m: { note: 'B', octave: 0 },
  s: { note: 'C#', octave: 0 },
  d: { note: 'D#', octave: 0 },
  g: { note: 'F#', octave: 0 },
  h: { note: 'G#', octave: 0 },
  j: { note: 'A#', octave: 0 },
  ',': { note: 'C', octave: 1 },
  '.': { note: 'D', octave: 1 },
  '/': { note: 'E', octave: 1 },
  l: { note: 'C#', octave: 1 },
  ';': { note: 'D#', octave: 1 },
  q: { note: 'C', octave: 1 },
  w: { note: 'D', octave: 1 },
  e: { note: 'E', octave: 1 },
  r: { note: 'F', octave: 1 },
  t: { note: 'G', octave: 1 },
  y: { note: 'A', octave: 1 },
  u: { note: 'B', octave: 1 },
  2: { note: 'C#', octave: 1 },
  3: { note: 'D#', octave: 1 },
  5: { note: 'F#', octave: 1 },
  6: { note: 'G#', octave: 1 },
  7: { note: 'A#', octave: 1 },
  i: { note: 'C', octave: 2 },
  o: { note: 'D', octave: 2 },
  p: { note: 'E', octave: 2 },
  '[': { note: 'F', octave: 2 },
  ']': { note: 'G', octave: 2 },
  9: { note: 'C#', octave: 2 },
  0: { note: 'D#', octave: 2 },
  '=': { note: 'F#', octave: 2 },
};

const event = (state = [], action) => {
  switch (action.type) {
    case constants.SET_NOTE_AT_CURSOR: {
      const note = keyToNote[action.note.key];
      return state.merge({
        note: note.note + (note.octave + 4),
        instrument: 0,
        delay: 0,
        panning: 80,
        volume: 40,
      });
    }
    default:
      return state;
  }
};

const track = (state = [], action) => {
  switch (action.type) {
    case constants.SET_NOTE_AT_CURSOR: {
      return state.merge(
        state.map((e, i) => (i === action.cursor.row ? event(e, action)
                                                     : e))
      );
    }
    default:
      return state;
  }
};

const pattern = (state = {}, action) => {
  switch (action.type) {
    case constants.SET_NOTE_AT_CURSOR: {
      return state.merge({
        trackdata: state.get('trackdata').map((t, i) => (i === action.cursor.track ? track(t, action)
                                                                                   : t)),
      });
    }
    default:
      return state;
  }
};

function songReducer(state = songInitialState, action) {
  switch (action.type) {
    case constants.SET_NOTE_AT_CURSOR: {
      return state.merge({
        patterns:
          state.get('patterns').map((p, i) => (i === 0 ? pattern(p, action)
                                                       : p)),
      });
    }
    case constants.SAVE_SONG: {
      const serializedState = JSON.stringify(state.toJS());
      localStorage.setItem('wetracker-song', serializedState);
      return state;
    }
    case constants.LOAD_SONG: {
      const serializedState = localStorage.getItem('wetracker-song');
      if (serializedState === null) {
        return undefined;
      }
      return state.merge(
        fromJS(JSON.parse(serializedState)),
        { refresh: true }
      );
    }
    case constants.DONE_REFRESH: {
      return state.deleteIn(['refresh']);
    }
    default:
      return state;
  }
}

const transportInitialState = fromJS({
  playing: false,
});

function transportReducer(state = transportInitialState, action) {
  switch (action.type) {
    case constants.PLAY: {
      return state.merge({
        playing: true,
      });
    }
    case constants.STOP: {
      return state.merge({
        playing: false,
      });
    }
    default:
      return state;
  }
}

/**
 * Creates the main reducer with the asynchronously loaded ones
 */
export default function createReducer(asyncReducers) {
  return combineReducers({
    route: routeReducer,
    language: languageProviderReducer,
    cursor: cursorReducer,
    song: songReducer,
    transport: transportReducer,
    ...asyncReducers,
  });
}
