import $ from 'jquery';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import sequencesTemplate from './templates/sequences.marko';

import styles from './styles.css';

export default class SequenceEditor {
  constructor(target) {
    this.target = target;
    this.yoff = 0;
    this.lastCursor = undefined;

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
    Signal.connect(song, "songChanged", this, "onSongChanged");
  }

  render() {
    const target = $(this.target);
    target.append(sequencesTemplate.renderToString({song: song.song, cursor: state.cursor.toJS()}));

    this.rowHeight = $(this.target).find(".sequence-row")[0].clientHeight;

    target.find(".sequence-top-padding div").height(
      (target.height()-this.rowHeight)/2.0);

    target.find(".sequence-bottom-padding div").height(
      (target.height()-this.rowHeight)/2.0);

    target.find('.sequence').on('mousewheel', this.onScroll.bind(this));

    target.find('button#add-pattern').click((e) => {
      song.addPattern(state.cursor.get("sequence"));
    });

    this.lastCursor = state.cursor.toJS();
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }

  onSongChanged() {
    this.refresh();
  }

  onCursorChanged() {
    if (state.cursor.get("sequence") != this.lastCursor.sequence) {
      $(this.target).find(".current-pattern").removeClass('current-pattern');
      $(this.target).find(".sequence-row").eq(state.cursor.get("sequence")).addClass('current-pattern');
      $(this.target).find(".list-container").scrollTop(state.cursor.get("sequence")*this.rowHeight);
    }
    this.lastCursor = state.cursor.toJS();
  }

  onScroll(e) {
    this.yoff += e.originalEvent.deltaY;
    var row = Math.floor((this.yoff) / this.rowHeight);
    var maxrow = song.song.sequence.length;
    row = ((row % maxrow) + maxrow) % maxrow;

    if(row !== this.lastCursor.sequence) {
      var pattern = song.song.sequence[row].pattern;
      state.set({
        cursor: {
          sequence: row,
          pattern,
        }
      });
    }
    e.preventDefault();
  }
}
