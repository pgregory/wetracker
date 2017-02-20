import $ from 'jquery';

import { connect } from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import controlsTemplate from './templates/instrument_controls.marko';

import './styles.css';

export default class InstrumentControls {
  constructor(target) {
    this.target = target;
    this.lastCursor = state.cursor;
    this.instrumentIndex = undefined;
    this.instrument = undefined;

    connect(state, 'cursorChanged', this, 'onCursorChanged');
  }

  render() {
    $(this.target).append(controlsTemplate.renderToString({ instrument: this.instrument }));
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }

  setInstrument(instrumentIndex) {
    this.instrumentIndex = instrumentIndex;
    this.instrument = song.getInstrument(instrumentIndex);
  }

  onCursorChanged() {
    if (state.cursor.get('instrument') !== this.lastCursor.get('instrument')) {
      this.setInstrument(state.cursor.get('instrument'));
      this.target.empty();
      this.render();
      this.lastCursor = state.cursor;
    }
  }

  onSongChanged() {
    this.setInstrument(state.cursor.get('instrument'));
    this.refresh();
  }
}
