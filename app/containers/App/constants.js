/*
 * AppConstants
 * Each action has a corresponding type, which the reducer knows and picks up on.
 * To avoid weird typos between the reducer and the actions, we save them as
 * constants here. We prefix them with 'yourproject/YourComponent' so we avoid
 * reducers accidentally picking up actions they shouldn't.
 *
 * Follow this format:
 * export const YOUR_ACTION_CONSTANT = 'yourproject/YourContainer/YOUR_ACTION_CONSTANT';
 */

export const CURSOR_RIGHT = 'wetracker/App/CURSOR_RIGHT';
export const CURSOR_LEFT = 'wetracker/App/CURSOR_LEFT';
export const CURSOR_UP = 'wetracker/App/CURSOR_UP';
export const CURSOR_DOWN = 'wetracker/App/CURSOR_DOWN';
export const CURSOR_SET_ROW = 'wetracker/App/CURSOR_SET_ROW';
export const CURSOR_SET_TRACK_ITEM = 'wetracker/App/CURSOR_SET_TRACK_ITEM';
export const SET_NOTE_AT_CURSOR = 'wetracker/App/SET_NOTE_AT_CURSOR';
export const CURSOR_TRACK_RIGHT = 'wetracker/App/CURSOR_TRACK_RIGHT';
export const CURSOR_TRACK_LEFT = 'wetracker/App/CURSOR_TRACK_LEFT';
export const SAVE_SONG = 'wetracker/App/SAVE_SONG';
export const LOAD_SONG = 'wetracker/App/LOAD_SONG';
export const DONE_REFRESH = 'wetracker/App/DONE_REFRESH';
export const PLAY = 'wetracker/App/PLAY';
export const STOP = 'wetracker/App/STOP';
