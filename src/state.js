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

    this.history = [];

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

    if ('transport' in state ) {
      snapshot.transport = this.transport;
    }

    // Don't undo/redo playingInstruments, they are transient, not user editable.

    if ('song' in state) {
      snapshot.song = this.song;
    }

    if (Object.keys(snapshot).length !== 0) {
      this.history.push({annotation, snapshot});
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
    this.history.push({annotation, group: 0});
  }

  groupHistoryEnd() {
    this.history.push({group: 1});
  }

  undo() {
    if (this.history.length > 0) {
      let past = this.history.pop();
      if ("group" in past && past.group === 1) {
        past = this.history.pop();
        while (!("group" in past) || past.group !== 0) {
          this.updateState(past.snapshot);
          past = this.history.pop();
        }
        console.log("Undo: " + past.annotation);
      }
    }
  }

  redo() {
    console.log("Redo");
  }
}

export let state = new State();
