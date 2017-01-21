import $ from 'jquery';

import '../../utils/inlineedit';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import instrumentsTemplate from './templates/instruments.marko';

import styles from './styles.css';

export default class InstrumentList {
  constructor(target) {
    this.target = target;
    this.yoff = 0;
    this.lastCursor = undefined;

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
    Signal.connect(song, "songChanged", this, "onSongChanged");
    Signal.connect(song, "instrumentListChanged", this, "onInstrumentListChanged");
  }

  render() {
    const target = $(this.target);
    target.addClass('instrument-list');

    const instrumentnames = song.getInstrumentNames();
    target.append(instrumentsTemplate.renderToString({instrumentnames, cursor: state.cursor.toJS()}));

    this.rowHeight = target.find(".instrument-row")[0].clientHeight;

    const containerHeight = target.find(".instruments-list").height();
    target.find(".instruments-top-padding div").height((containerHeight - this.rowHeight)/2.0);

    target.find(".instruments-bottom-padding div").height(
      (containerHeight-this.rowHeight)/2.0);

    target.find('.instruments').on('mousewheel', this.onScroll.bind(this));

    target.find('.instrument-row').click((e) => {
      const instrument = $(e.currentTarget).data('instrumentindex');
      state.set({
        cursor: {
          instrument,
        },
      });
    });

    target.find('#add-instrument').click((e) => {
      const instr = song.addInstrument()
      state.set({
        cursor: {
          instrument: instr,
          sample: 0,
        }
      });
    });

    target.find('.instrument-name div').inlineEdit({
      accept: function(val) {
        const row = $(this).parents('.instrument-row');
        if (row) {
          const instrindex = row.data('instrumentindex');
          song.setInstrumentName(instrindex, val);
        }
      },
    });

    this.scrollToInstrument(state.cursor.get("instrument"));

    this.lastCursor = state.cursor.toJS();
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }

  onSongChanged() {
    this.refresh();
  }

  onInstrumentListChanged() {
    this.refresh();
  }

  scrollToInstrument(instrument) {
    const target = $(this.target);
    target.find(".current-instrument").removeClass('current-instrument');
    target.find(".instrument-row").eq(instrument).addClass('current-instrument');
    target.find(".instruments-list").scrollTop(instrument * this.rowHeight);
  }

  onCursorChanged() {
    if (state.cursor.get("instrument") !== this.lastCursor.instrument) {
      this.scrollToInstrument(state.cursor.get("instrument"));
    }
    this.lastCursor = state.cursor.toJS();
  }

  onScroll(e) {
    this.yoff += e.originalEvent.deltaY;
    var row = Math.floor((this.yoff) / this.rowHeight);
    var maxrow = song.getNumInstruments();
    row = ((row % maxrow) + maxrow) % maxrow;

    if(row !== this.lastCursor.instrument) {
      state.set({
        cursor: {
          instrument: row,
          sample: 0,
        }
      });
    }

    e.preventDefault();
  }
}
