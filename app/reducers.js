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
/* 00 */ { note: 'E4', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 01 */ {},
/* 02 */ { note: 'D#5', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 03 */ {},
/* 04 */ { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 05 */ {},
/* 06 */ { note: 'D#5', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 07 */ {},
/* 08 */ { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 09 */ {},
/* 0A */ { note: 'B4', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 0B */ {},
/* 0C */ { note: 'D5', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 0D */ {},
/* 0E */ { note: 'C5', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 0F */ {},
/* 10 */ { note: 'A2', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 11 */ {},
/* 12 */ {},
/* 13 */ {},
/* 14 */ {},
/* 15 */ {},
/* 16 */ {},
/* 17 */ {},
/* 18 */ { note: 'E4', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 19 */ {},
/* 1A */ {},
/* 1B */ {},
/* 1C */ { note: 'E2', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 1D */ {},
/* 1E */ {},
/* 1F */ {},
/* 20 */ {},
/* 21 */ {},
/* 22 */ {},
/* 23 */ {},
/* 24 */ { note: 'G#4', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 25 */ {},
/* 26 */ {},
/* 27 */ {},
/* 28 */ { note: 'A2', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 29 */ {},
/* 2A */ {},
/* 2B */ {},
/* 2C */ {},
/* 2D */ {},
/* 2E */ {},
/* 2F */ {},
/* 30 */ { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 31 */ {},
/* 32 */ { note: 'D#5', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 33 */ {},
/* 34 */ { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 35 */ {},
/* 36 */ { note: 'D#5', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 37 */ {},
/* 38 */ { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 39 */ {},
/* 3A */ { note: 'B4', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 3B */ {},
/* 3C */ { note: 'D5', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 3D */ {},
/* 3E */ { note: 'C5', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 3F */ {},
      ],
      [
/* 00 */ {},
/* 01 */ {},
/* 02 */ {},
/* 03 */ {},
/* 04 */ {},
/* 05 */ {},
/* 06 */ {},
/* 07 */ {},
/* 08 */ {},
/* 09 */ {},
/* 0A */ {},
/* 0B */ {},
/* 0C */ {},
/* 0D */ {},
/* 0E */ {},
/* 0F */ {},
/* 10 */ { note: 'A4', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 11 */ {},
/* 12 */ {},
/* 13 */ {},
/* 14 */ { note: 'A3', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 15 */ {},
/* 16 */ {},
/* 17 */ {},
/* 18 */ {},
/* 19 */ {},
/* 1A */ { note: 'A4', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 1B */ {},
/* 1C */ { note: 'B4', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 1D */ {},
/* 1E */ {},
/* 1F */ {},
/* 20 */ { note: 'G#3', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 21 */ {},
/* 22 */ {},
/* 23 */ {},
/* 24 */ {},
/* 25 */ {},
/* 26 */ { note: 'B4', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 27 */ {},
/* 28 */ { note: 'C5', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 29 */ {},
/* 2A */ {},
/* 2B */ {},
/* 2C */ { note: 'A3', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 2D */ {},
/* 2E */ {},
/* 2F */ {},
/* 30 */ {},
/* 31 */ {},
/* 32 */ {},
/* 33 */ {},
/* 34 */ {},
/* 35 */ {},
/* 36 */ {},
/* 37 */ {},
/* 38 */ {},
/* 39 */ {},
/* 3A */ {},
/* 3B */ {},
/* 3C */ {},
/* 3D */ {},
/* 3E */ {},
/* 3F */ {},
      ],
      [
/* 00 */ {},
/* 01 */ {},
/* 02 */ {},
/* 03 */ {},
/* 04 */ {},
/* 05 */ {},
/* 06 */ {},
/* 07 */ {},
/* 08 */ {},
/* 09 */ {},
/* 0A */ {},
/* 0B */ {},
/* 0C */ {},
/* 0D */ {},
/* 0E */ {},
/* 0F */ {},
/* 10 */ {},
/* 11 */ {},
/* 12 */ { note: 'E3', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 13 */ {},
/* 14 */ {},
/* 15 */ {},
/* 16 */ {},
/* 17 */ {},
/* 18 */ {},
/* 19 */ {},
/* 1A */ {},
/* 1B */ {},
/* 1C */ { /* Stop */ },
/* 1D */ {},
/* 1E */ { note: 'E3', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 1F */ {},
/* 20 */ {},
/* 21 */ {},
/* 22 */ {},
/* 23 */ {},
/* 24 */ {},
/* 25 */ {},
/* 26 */ {},
/* 27 */ {},
/* 28 */ { /* Stop */ },
/* 29 */ {},
/* 2A */ { note: 'E3', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 2B */ {},
/* 2C */ {},
/* 2D */ {},
/* 2E */ {},
/* 2F */ {},
/* 30 */ {},
/* 31 */ {},
/* 32 */ { /* Stop */ },
/* 33 */ {},
/* 34 */ {},
/* 35 */ {},
/* 36 */ {},
/* 37 */ {},
/* 38 */ {},
/* 39 */ {},
/* 3A */ {},
/* 3B */ {},
/* 3C */ {},
/* 3D */ {},
/* 3E */ {},
/* 3F */ {},
      ],
      [
/* 00 */ {},
/* 01 */ {},
/* 02 */ {},
/* 03 */ {},
/* 04 */ {},
/* 05 */ {},
/* 06 */ {},
/* 07 */ {},
/* 08 */ {},
/* 09 */ {},
/* 0A */ {},
/* 0B */ {},
/* 0C */ {},
/* 0D */ {},
/* 0E */ {},
/* 0F */ {},
/* 10 */ {},
/* 11 */ {},
/* 12 */ {},
/* 13 */ {},
/* 14 */ {},
/* 15 */ {},
/* 16 */ { note: 'C4', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 17 */ {},
/* 18 */ {},
/* 19 */ {},
/* 1A */ {},
/* 1B */ {},
/* 1C */ { /* Stop */ },
/* 1D */ {},
/* 1E */ {},
/* 1F */ {},
/* 20 */ {},
/* 21 */ {},
/* 22 */ { note: 'E4', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 23 */ {},
/* 24 */ {},
/* 25 */ {},
/* 26 */ {},
/* 27 */ {},
/* 28 */ { /* Stop */ },
/* 29 */ {},
/* 2A */ {},
/* 2B */ {},
/* 2C */ {},
/* 2D */ {},
/* 2E */ { note: 'E4', instrument: 1, volume: 40, panning: 80, delay: 0 },
/* 2F */ {},
/* 30 */ {},
/* 31 */ {},
/* 32 */ { /* Stop */ },
/* 33 */ {},
/* 34 */ {},
/* 35 */ {},
/* 36 */ {},
/* 37 */ {},
/* 38 */ {},
/* 39 */ {},
/* 3A */ {},
/* 3B */ {},
/* 3C */ {},
/* 3D */ {},
/* 3E */ {},
/* 3F */ {},
      ],
      [
/* 00 */ {},
/* 01 */ {},
/* 02 */ {},
/* 03 */ {},
/* 04 */ {},
/* 05 */ {},
/* 06 */ {},
/* 07 */ {},
/* 08 */ {},
/* 09 */ {},
/* 0A */ {},
/* 0B */ {},
/* 0C */ {},
/* 0D */ {},
/* 0E */ {},
/* 0F */ {},
/* 10 */ {},
/* 11 */ {},
/* 12 */ {},
/* 13 */ {},
/* 14 */ {},
/* 15 */ {},
/* 16 */ {},
/* 17 */ {},
/* 18 */ {},
/* 19 */ {},
/* 1A */ {},
/* 1B */ {},
/* 1C */ {},
/* 1D */ {},
/* 1E */ {},
/* 1F */ {},
/* 20 */ {},
/* 21 */ {},
/* 22 */ {},
/* 23 */ {},
/* 24 */ {},
/* 25 */ {},
/* 26 */ {},
/* 27 */ {},
/* 28 */ {},
/* 29 */ {},
/* 2A */ {},
/* 2B */ {},
/* 2C */ {},
/* 2D */ {},
/* 2E */ {},
/* 2F */ {},
/* 30 */ {},
/* 31 */ {},
/* 32 */ {},
/* 33 */ {},
/* 34 */ {},
/* 35 */ {},
/* 36 */ {},
/* 37 */ {},
/* 38 */ {},
/* 39 */ {},
/* 3A */ {},
/* 3B */ {},
/* 3C */ {},
/* 3D */ {},
/* 3E */ {},
/* 3F */ {},
      ],
      [
/* 00 */ {},
/* 01 */ {},
/* 02 */ {},
/* 03 */ {},
/* 04 */ {},
/* 05 */ {},
/* 06 */ {},
/* 07 */ {},
/* 08 */ {},
/* 09 */ {},
/* 0A */ {},
/* 0B */ {},
/* 0C */ {},
/* 0D */ {},
/* 0E */ {},
/* 0F */ {},
/* 10 */ {},
/* 11 */ {},
/* 12 */ {},
/* 13 */ {},
/* 14 */ {},
/* 15 */ {},
/* 16 */ {},
/* 17 */ {},
/* 18 */ {},
/* 19 */ {},
/* 1A */ {},
/* 1B */ {},
/* 1C */ {},
/* 1D */ {},
/* 1E */ {},
/* 1F */ {},
/* 20 */ {},
/* 21 */ {},
/* 22 */ {},
/* 23 */ {},
/* 24 */ {},
/* 25 */ {},
/* 26 */ {},
/* 27 */ {},
/* 28 */ {},
/* 29 */ {},
/* 2A */ {},
/* 2B */ {},
/* 2C */ {},
/* 2D */ {},
/* 2E */ {},
/* 2F */ {},
/* 30 */ {},
/* 31 */ {},
/* 32 */ {},
/* 33 */ {},
/* 34 */ {},
/* 35 */ {},
/* 36 */ {},
/* 37 */ {},
/* 38 */ {},
/* 39 */ {},
/* 3A */ {},
/* 3B */ {},
/* 3C */ {},
/* 3D */ {},
/* 3E */ {},
/* 3F */ {},
      ],
    ],
  }],
});

/* const track = (state = [], action) => {
  switch (action.type) {
    case SET_NOTE_AT_CURSOR: {
    }
    default:
      return state;
  }
}

const pattern = (state = [], action) => {
  switch (action.type) {
    case SET_NOTE_AT_CURSOR: {
    }
    default:
      return state;
  }
}*/

function songReducer(state = songInitialState, action) {
  switch (action.type) {
    case SET_NOTE_AT_CURSOR: {
      // console.log(action.cursor, action.note.key);
      // console.log(state.getIn(['patterns', 0, 'trackdata', 0, 0, 'note']));
      return state.merge({
        patterns: [
          state.patterns.map((pattern, i) => (i === 0 ? pattern(pattern, action)
                                                      : pattern)),
        ],
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
    ...asyncReducers,
  });
}
