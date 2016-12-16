import $ from 'jquery';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import samplesTemplate from './templates/samples.marko';

import styles from './styles.css';

export default class SampleList {
  constructor(target) {
    this.target = target;
    this.yoff = 0;
    this.lastCursor = undefined;

    this.updateSample();

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
    Signal.connect(song, "songChanged", this, "onSongChanged");
  }

  render() {
    $(this.target).addClass('sample-list');

    $(this.target).append(samplesTemplate.renderToString({samples: this.instrument.samples, cursor: state.cursor.toJS()}));

    this.rowHeight = $(this.target).find(".samples-row")[0].clientHeight;

    $(this.target).find(".samples-top-padding div").height(
      ($(this.target).height()-this.rowHeight)/2.0);

    $(this.target).find(".samples-bottom-padding div").height(
      ($(this.target).height()-this.rowHeight)/2.0);

    $(this.target).find('.samples').on('mousewheel', this.onScroll.bind(this));

    this.lastCursor = state.cursor.toJS();
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }

  updateSample() {
    const cur_instr = state.cursor.get("instrument");
    this.instrument = song.song.instruments[cur_instr];
  }

  onSongChanged() {
    this.updateSample();
    this.refresh();
  }

  onCursorChanged() {
    if ((state.cursor.get("instrument") !== this.lastCursor.instrument) ||
        (state.cursor.get("sample") !== this.lastCursor.sample)) {
      this.updateSample();

      const cur_sample = state.cursor.get("sample");

      $(this.target).find(".current-sample").removeClass('current-sample');
      $(this.target).find(".samples-row").eq(cur_sample).addClass('current-sample');
      $(this.target).scrollTop(cur_sample*this.rowHeight);
    }
    this.lastCursor = state.cursor.toJS();
  }

  onScroll(e) {
    this.yoff += e.originalEvent.deltaY;
    var row = Math.floor((this.yoff) / this.rowHeight);
    var maxrow = this.instrument.samples.length;
    row = ((row % maxrow) + maxrow) % maxrow;

    if(row !== this.lastCursor.sample) {
      state.set({
        cursor: {
          sample: row,
        }
      });
    }

    e.preventDefault();
  }
}
