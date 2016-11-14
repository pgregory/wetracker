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
        t -= 1;
        if (t < 0) {
          t = action.tracks.length - 1;
        }
        i = (action.tracks[t].notecolumns * 6) - 1;
      }
      return state.merge({
        item: i,
        track: t,
      });
    }
    case constants.CURSOR_RIGHT: {
      let i = state.get('item') + action.step;
      let t = state.get('track');
      const tmax = action.tracks[t].notecolumns * 6;
      if (i >= tmax) {
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
    trackdata: [{
      notecolumns: 3,
      fxcolumns: 1,
      name: 'Bass',
      type: 'play',
      notedata: [
        { notes: [{ note: 'C4', instrument: 1, volume: 40, panning: 80, delay: 0 },
                  { note: 'E4', instrument: 1, volume: 40, panning: 80, delay: 0 },
                  { note: 'G4', instrument: 1, volume: 40, panning: 80, delay: 0 },
                 ] },
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
      ],
    }, {
      notecolumns: 1,
      fxcolumns: 1,
      name: 'Bass',
      type: 'play',
      notedata: [
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
      ],
    }, {
      notecolumns: 1,
      fxcolumns: 1,
      name: 'Bass',
      type: 'play',
      notedata: [
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
      ],
    }, {
      notecolumns: 1,
      fxcolumns: 1,
      name: 'Bass',
      type: 'play',
      notedata: [
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
      ],
    }, {
      notecolumns: 1,
      fxcolumns: 1,
      name: 'Bass',
      type: 'play',
      notedata: [
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
      ],
    }, {
      notecolumns: 1,
      fxcolumns: 1,
      name: 'Bass',
      type: 'play',
      notedata: [
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
        {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {},
      ],
    }],
  }],
});


const note = (state = [], action) => {
  switch (action.type) {
    case constants.SET_NOTE_AT_CURSOR: {
      return state.merge(
        action.note
      );
    }
    default:
      return state;
  }
};


const event = (state = {}, action) => {
  switch (action.type) {
    case constants.SET_NOTE_AT_CURSOR: {
      let notes = fromJS([]);
      if (state.get('notes')) {
        notes = state.get('notes');
      }
      if (notes.size <= (action.cursor.item % 5)) {
        notes = fromJS(notes.concat(Array(((action.cursor.item % 5) - notes.size) + 1).fill(fromJS({}))));
      }
      return state.merge({
        notes: notes.map((n, i) => (i === (action.cursor.item % 5) ? note(n, action)
                                                                   : n)),
      });
    }
    default:
      return state;
  }
};

const track = (state = {}, action) => {
  switch (action.type) {
    case constants.SET_NOTE_AT_CURSOR: {
      return state.merge({
        notedata: state.get('notedata').map((e, i) => (i === action.cursor.row ? event(e, action)
                                                                               : e)),
      });
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
  step: 4,
  octave: 4,
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
    case constants.STEP_CHANGE: {
      return state.merge({
        step: action.step,
      });
    }
    case constants.OCTAVE_CHANGE: {
      return state.merge({
        octave: action.octave,
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
