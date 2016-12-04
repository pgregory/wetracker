import $ from 'jquery';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import instrumentsTemplate from './templates/instruments.marko';

import styles from './styles.css';

export default class Monitors {
  constructor(target) {
    this.target = target;
    this.yoff = 0;
    this.lastCursor = undefined;

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
    Signal.connect(song, "songChanged", this, "onSongChanged");
  }

  render() {
    $(this.target).append(instrumentsTemplate.renderSync({song: song.song, cursor: state.cursor.toJS()}));

    this.rowHeight = $(this.target).find(".instrument-row")[0].clientHeight;

    $(this.target).find(".instruments-top-padding div").height(
      ($(this.target).height()-this.rowHeight)/2.0);

    $(this.target).find(".instruments-bottom-padding div").height(
      ($(this.target).height()-this.rowHeight)/2.0);

    $(this.target).find('.instruments').on('mousewheel', this.onScroll.bind(this));

    this.lastCursor = state.cursor.toJS();
  }

  onSongChanged() {
    this.target.empty();
    this.render();
  }

  onCursorChanged() {
    if (state.cursor.get("instrument") !== this.lastCursor.instrument) {
      $(this.target).find(".current-instrument").removeClass('current-instrument');
      $(this.target).find(".instrument-row").eq(state.cursor.get("instrument")).addClass('current-instrument');
      $(this.target).scrollTop(state.cursor.get("instrument")*this.rowHeight);
    }
    this.lastCursor = state.cursor.toJS();
  }

  onScroll(e) {
    this.yoff += e.originalEvent.deltaY;
    var row = Math.floor((this.yoff) / this.rowHeight);
    var maxrow = song.song.instruments.length;
    row = ((row % maxrow) + maxrow) % maxrow;

    if(row !== this.lastCursor.instrument) {
      state.set({
        cursor: {
          instrument: row,
        }
      });
    }

    e.preventDefault();
  }
}
