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
    });

    this.playingInstruments = new Immutable.Map({
      t: 0,
      positions: [],
    });

    this.cursorChanged = Signal.signal(true);
    this.tracksChanged = Signal.signal(true);
    this.transportChanged = Signal.signal(true);
    this.playingInstrumentsChanged = Signal.signal(true);
  }


  set(state) {
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
  }
}

export let state = new State();
