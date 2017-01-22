import Immutable from 'immutable';
import Signal from './utils/signal';

export class State {
  constructor() {
    this.cursor = new Immutable.Map({
      pattern: 0,
      sequence: 0,
      row: 0,
      track: 0,
      column: 0,
      item: 0,
      instrument: 0,
      sample: 0,
      record: false,
    });

    this.tracks = new Immutable.Map({
      t: 0,
      VU: [],
      scopes: [],
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

    this.history = [{}];
    this.historyIndex = 0;

    this.cursorChanged = Signal.signal(true);
    this.tracksChanged = Signal.signal(true);
    this.transportChanged = Signal.signal(true);
    this.playingInstrumentsChanged = Signal.signal(true);
    this.songChanged = Signal.signal(true);
  }

  recordHistory(state, annotation) {
    const snapshot = {};
    
    // Don't undo/redo cursor, it would be too intensive.

    // Don't undo/redo tracks, they are transient, not user editable.

    /*if ('transport' in state ) {
      snapshot.transport = this.transport;
    }*/

    // Don't undo/redo playingInstruments, they are transient, not user editable.

    if ('song' in state) {
      snapshot.song = this.song;
    }

    if (Object.keys(snapshot).length !== 0) {
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push({annotation, snapshot});
      this.historyIndex += 1;
    }
  }


  set(state, annotation) {
    this.recordHistory(state, annotation);
    this.updateState(state);
  }

  updateState(state) {
    if ('cursor' in state ) {
      this.cursor = this.cursor.merge(state.cursor);
      this.cursorChanged();
    }

    if ('tracks' in state ) {
      this.tracks = this.tracks.merge(state.tracks);
      this.tracksChanged();
    }

    if ('transport' in state ) {
      this.transport = this.transport.merge(state.transport);
      this.transportChanged();
    }

    if ('playingInstruments' in state ) {
      this.playingInstruments = this.playingInstruments.merge(state.playingInstruments);
      this.playingInstrumentsChanged();
    }

    if ('song' in state) {
      this.song = this.song.merge(state.song);
      this.songChanged();
    }
  }

  groupHistoryStart(annotation) {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push({annotation, group: 0});
    this.historyIndex += 1;
  }

  groupHistoryEnd() {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push({group: 1});
    this.historyIndex += 1;
  }

  undo() {
    if (this.historyIndex > 0) {
      let past = this.history[this.historyIndex];
      this.historyIndex -= 1;
      if ("group" in past && past.group === 1) {
        past = this.history[this.historyIndex];
        this.historyIndex -= 1;
        while ((this.historyIndex > 0) &&
               (!("group" in past) || past.group !== 0)) {
          this.updateState(past.snapshot);
          past = this.history[this.historyIndex];
          this.historyIndex -= 1;
        }
        console.log("Undo: " + past.annotation);
      } else {
        this.updateState(past.snapshot);
        console.log("Undo: " + past.annotation);
      }
    }
  }

  redo() {
    if (this.historyIndex < this.history.length) {
      this.historyIndex += 1;
      let future = this.history[this.historyIndex];
      let annotation = future.annotation;
      if ("group" in future && future.group === 0) {
        this.historyIndex += 1;
        future = this.history[this.historyIndex];
        do {
          this.updateState(future.snapshot);
          this.historyIndex += 1;
          future = this.history[this.historyIndex];
        } while ((this.historyIndex < this.history.length) &&
               (!("group" in future) || future.group !== 1))
        console.log("Redo: " + annotation);
      } else {
        this.updateState(future.snapshot);
        console.log("Redo: " + annotation);
      }
    }
  }

  clearHistory() {
    this.history = [{}];
    this.historyIndex = 0;
  }
}

export let state = new State();
