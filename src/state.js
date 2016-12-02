import Immutable from 'immutable';
import Signal from './utils/signal';

export class State {
  constructor() {
    this.cursor = new Immutable.Map({
      pattern: 'p1',
      row: 0,
      track: 0,
      column: 0,
      item: 0,
    });

    this.tracks = new Immutable.Map({
      t: 0,
      VU: [],
      scopes: [],
    });

    this.cursorChanged = Signal.signal(true);
    this.tracksChanged = Signal.signal(true);
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
  }
}

export let state = new State();
