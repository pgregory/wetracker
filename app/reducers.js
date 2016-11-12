/**
 * Combine all reducers in this file and export the combined reducers.
 * If we were to do this in store.js, reducers wouldn't be hot reloadable.
 */

import { combineReducers } from 'redux-immutable';
import { fromJS } from 'immutable';
import { LOCATION_CHANGE } from 'react-router-redux';
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
} from 'containers/App/constants';
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
});

function cursorReducer(state = cursorInitialState, action) {
  switch (action.type) {
    case CURSOR_UP: {
      let t = state.get('row') - action.step;
      if (t < 0) {
        t = action.patternRows - 1;
      }
      return state.merge({
        row: t,
      });
    }
    case CURSOR_DOWN: {
      let t = state.get('row') + action.step;
      if (t >= action.patternRows) {
        t = 0;
      }
      return state.merge({
        row: t,
      });
    }
    case CURSOR_LEFT: {
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
    case CURSOR_RIGHT: {
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
    case CURSOR_TRACK_LEFT: {
      let t = state.get('track') - action.step;
      if (t < 0) {
        t = action.tracks.length - 1;
      }
      return state.merge({
        track: t,
      });
    }
    case CURSOR_TRACK_RIGHT: {
      let t = state.get('track') + action.step;
      if (t >= action.tracks.length) {
        t = 0;
      }
      return state.merge({
        track: t,
      });
    }
    case CURSOR_SET_ROW:
      return state.merge({
        row: action.row,
      });
    case CURSOR_SET_TRACK_ITEM:
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
  a: { note: 'C', octave: 0 },
  s: { note: 'D', octave: 0 },
  d: { note: 'E', octave: 0 },
  f: { note: 'F', octave: 0 },
  g: { note: 'G', octave: 0 },
  h: { note: 'A', octave: 0 },
  j: { note: 'B', octave: 0 },
  k: { note: 'C', octave: 1 },
  l: { note: 'D', octave: 1 },
  w: { note: 'C#', octave: 0 },
  e: { note: 'D#', octave: 0 },
  t: { note: 'F#', octave: 0 },
  y: { note: 'G#', octave: 0 },
  u: { note: 'A#', octave: 0 },
  o: { note: 'C#', octave: 1 },
};

const event = (state = [], action) => {
  switch (action.type) {
    case SET_NOTE_AT_CURSOR: {
      const note = keyToNote[action.note.key];
      return state.merge({
        note: note.note + note.octave,
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
    case SET_NOTE_AT_CURSOR: {
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
    case SET_NOTE_AT_CURSOR: {
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
    case SET_NOTE_AT_CURSOR: {
      return state.merge({
        patterns:
          state.get('patterns').map((p, i) => (i === 0 ? pattern(p, action)
                                                       : p)),
      });
    }
    case SAVE_SONG: {
      const serializedState = JSON.stringify(state.toJS());
      localStorage.setItem('wetracker-song', serializedState);
      return state;
    }
    case LOAD_SONG: {
      const serializedState = localStorage.getItem('wetracker-song');
      if (serializedState === null) {
        return undefined;
      }
      return state.merge(
        fromJS(JSON.parse(serializedState)),
        { refresh: true }
      );
    }
    case DONE_REFRESH: {
      return state.deleteIn(['refresh']);
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
    ...asyncReducers,
  });
}
