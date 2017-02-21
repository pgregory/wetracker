import $ from 'jquery';

import { connect } from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import sequencesTemplate from './templates/sequences.marko';

import './styles.css';

export default class SequenceEditor {
  constructor(target) {
    this.target = target;
    this.yoff = 0;
    this.lastCursor = undefined;

    connect(state, 'cursorChanged', this, 'onCursorChanged');
    connect(song, 'sequenceChanged', this, 'onSequenceChanged');
    connect(song, 'songChanged', this, 'onSongChanged');
    connect(song, 'sequenceItemChanged', this, 'onSequenceItemChanged');
  }

  render() {
    const target = $(this.target);

    const sequence = song.getSequencePatterns();
    target.append(sequencesTemplate.renderToString({ sequence, cursor: state.cursor.toJS() }));

    try {
      this.rowHeight = $(this.target).find('.sequence-row')[0].clientHeight;
    } catch (e) {
      this.rowHeight = 0;
    }

    target.find('.sequence-top-padding div').height(
      (target.height() - this.rowHeight) / 2.0);

    target.find('.sequence-bottom-padding div').height(
      (target.height() - this.rowHeight) / 2.0);

    target.find('.sequence').on('mousewheel', this.onScroll.bind(this));

    target.find('button#add-pattern').click(() => {
      song.addPattern(state.cursor.get('sequence'));
    });

    target.find('button#delete-pattern').click(() => {
      song.deletePattern(state.cursor.get('sequence'));
    });

    target.find('button#clone-pattern').click(() => {
      song.clonePattern(state.cursor.get('sequence'));
    });

    target.find('button#duplicate-pattern').click(() => {
      song.duplicatePattern(state.cursor.get('sequence'));
    });

    target.find('button#pattern-up').click(() => {
      song.updateSequencePattern(state.cursor.get('sequence'), 1);
    });

    target.find('button#pattern-down').click(() => {
      song.updateSequencePattern(state.cursor.get('sequence'), -1);
    });

    this.lastCursor = state.cursor.toJS();
  }

  refresh() {
    $(this.target).empty();
    this.render();
    this.showCurrentSequence();
  }

  showCurrentSequence() {
    $(this.target).find('.current-pattern').removeClass('current-pattern');
    $(this.target).find('.sequence-row').eq(state.cursor.get('sequence')).addClass('current-pattern');
    $(this.target).find('.list-container').scrollTop(state.cursor.get('sequence') * this.rowHeight);
  }

  onSongChanged() {
    this.refresh();
  }

  onSequenceChanged() {
    this.refresh();
  }

  onSequenceItemChanged(sequence) {
    const s = $(this.target).find(`.sequence-row[data-sequenceindex='${sequence}'] .sequence-pattern div`);
    s.text(song.getSequencePatternNumber(sequence));
  }

  onCursorChanged() {
    if (state.cursor.get('sequence') !== this.lastCursor.sequence) {
      this.showCurrentSequence();
    }
    this.lastCursor = state.cursor.toJS();
  }

  onScroll(e) {
    this.yoff += e.originalEvent.deltaY;
    if (Math.abs(this.yoff) >= this.rowHeight) {
      const rowIncr = Math.floor(this.yoff / this.rowHeight);
      let row = state.cursor.get('sequence') + rowIncr;
      const maxrow = song.getSequenceLength() - 1;
      row = Math.min(Math.max(row, 0), maxrow);

      if (row !== this.lastCursor.sequence) {
        const pattern = song.getSequencePatternNumber(row);

        let patrow = state.cursor.get('row');
        const maxpatrow = song.getPatternRowCount(pattern);
        patrow = ((patrow % maxpatrow) + maxpatrow) % maxpatrow;

        state.set({
          cursor: {
            row: patrow,
            sequence: row,
            pattern,
          },
        });
      }
      this.yoff -= (rowIncr * this.rowHeight);
    }
    e.preventDefault();
  }
}
