import $ from 'jquery';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import controlsTemplate from './templates/instrument_controls.marko';

import styles from './styles.css';

export default class InstrumentControls {
  constructor(target) {
    this.target = target;
    this.lastCursor = state.cursor;
    this.instrument = undefined;

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
  }

  render() {
    $(this.target).addClass('instrument-controls');
    const cur_instr = state.cursor.get("instrument");

    try {
      this.instrument = song.song.instruments[cur_instr];

      if (this.instrument && 'samples' in this.instrument && this.instrument.samples.length > 0) {
        $(this.target).append(controlsTemplate.renderToString({instrument: this.instrument}));
      }
    } catch(e) {
      console.log(e);
    }
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }

  onCursorChanged() {
    if (state.cursor.get("instrument") !== this.lastCursor.get("instrument")) {
      this.target.empty();
      this.render();
      this.lastCursor = state.cursor;
    }
  }

  onSongChanged() {
    this.refresh();
  }
}
