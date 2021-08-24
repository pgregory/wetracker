import Immutable from 'immutable';
import { signal } from './utils/signal';

export class State {
  constructor() {
    this.cursor = new Immutable.Map({
      pattern: 0,
      sequence: 0,
      recordSequence: 0,
      row: 0,
      row_start: 0,
      row_end: 0,
      track: 0,
      track_start: 0,
      track_end: 0,
      column: 0,
      column_start: 0,
      column_end: 0,
      item: 0,
      item_start: 0,
      item_end: 0,
      instrument: 0,
      sample: 0,
      record: false,
      selecting: false,
      saveStream: false,
    });

    this.transport = new Immutable.Map({
      step: 4,
      octave: 4,
      bpm: 125,
      speed: 6,
      masterVolume: 1.0,
    });

    this.playingInstruments = new Immutable.Map({
      t: 0,
      positions: [],
    });

    this.song = new Immutable.Map();

    this.history = [{
      snapshot: {
        song: this.song,
      },
      annotation: 'Start',
    }];
    this.historyIndex = 0;
    this.historyGrouping = false;
    this.historyGroupAnnotation = '';

    this.cursorChanged = signal(true);
    this.transportChanged = signal(true);
    this.playingInstrumentsChanged = signal(true);
    this.songChanged = signal(true);
  }

  recordCurrentState(annotation) {
    if (!this.historyGrouping) {
      const snapshot = {
        song: this.song,
      };
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push({ annotation, snapshot });
      // Move the pointer forward, historyIndex now points at the
      // current state duplicated in the history buffer.
      this.historyIndex += 1;
    }
  }

  set(state, annotation) {
    // Update the current state
    this.updateState(state);
    // Push a reference to this new state onto the history buffer.
    if ('song' in state) {
      this.recordCurrentState(annotation);
    }
  }

  updateState(state) {
    if ('cursor' in state) {
      this.cursor = this.cursor.merge(state.cursor);
      this.cursorChanged();
    }

    if ('transport' in state) {
      this.transport = this.transport.merge(state.transport);
      this.transportChanged();
    }

    if ('playingInstruments' in state) {
      this.playingInstruments = this.playingInstruments.merge(state.playingInstruments);
      this.playingInstrumentsChanged();
    }

    if ('song' in state) {
      this.song = this.song.merge(state.song);
    }
  }

  groupHistoryStart(annotation) {
    // Tell the history that it doesn't need to record anything until we've done the group
    this.historyGrouping = true;
    this.historyGroupAnnotation = annotation;
  }

  groupHistoryEnd() {
    // Tell the history that it has completed the group, and take a snapshot of the current
    // state.
    this.historyGrouping = false;
    this.recordCurrentState(this.historyGroupAnnotation);
    this.historyGroupAnnotation = '';
  }

  undo() {
    let now;
    let past;
    // If there is any history to undo.
    if (this.historyIndex > 0) {
      now = this.history[this.historyIndex];
      // Move the marker back to the previous state in history.
      this.historyIndex -= 1;
      // Get the state at this point in history
      past = this.history[this.historyIndex];
      // Apply that historic state to the current state.
      try {
        this.updateState(past.snapshot);
        this.songChanged();
        console.log(`Undo: ${now.annotation}`);
      } catch (e) {
        console.log(e);
      }
    }
  }

  redo() {
    let future;
    // Check if there is any future state to restore
    if (this.historyIndex < this.history.length - 1) {
      // Move the marker forward in history.
      this.historyIndex += 1;
      // Get the state at this point in history
      future = this.history[this.historyIndex];
      // Apply that historic state to the current state.
      try {
        this.updateState(future.snapshot);
        this.songChanged();
        console.log(`Redo: ${future.annotation}`);
      } catch (e) {
        console.log(e);
      }
    }
  }

  clearHistory() {
    this.history = [{
      snapshot: {
        song: this.song,
      },
      annotation: 'Reset',
    }];
    this.historyIndex = 0;
  }
}

export const state = new State();
