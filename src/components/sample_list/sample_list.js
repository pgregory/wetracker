import $ from 'jquery';

import '../../utils/inlineedit';

import { connect } from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';
import { player } from '../../audio/player';

import samplesTemplate from './templates/samples.marko';

import './styles.css';

export default class SampleList {
  constructor(target) {
    this.target = target;
    this.yoff = 0;
    this.lastCursor = undefined;

    this.updateSample();

    connect(state, 'cursorChanged', this, 'onCursorChanged');
    connect(song, 'songChanged', this, 'onSongChanged');
    connect(song, 'instrumentChanged', this, 'onInstrumentChanged');
  }

  render() {
    const target = $(this.target);

    target.addClass('sample-list');

    target.append(samplesTemplate.renderToString({ samples: this.instrument.samples, cursor: state.cursor.toJS() }));

    if (this.instrument && this.instrument.samples && this.instrument.samples.length > 0) {
      this.rowHeight = target.find('.samples-row')[0].clientHeight;

      const containerHeight = target.find('.samples-list').height();
      target.find('.samples-top-padding div').height(
        (containerHeight - this.rowHeight) / 2.0
      );

      target.find('.samples-bottom-padding div').height(
        (containerHeight - this.rowHeight) / 2.0
      );
    }
    target.find('.samples').on('wheel', this.onScroll.bind(this));

    target.find('.samples-row').click((e) => {
      const sample = $(e.currentTarget).data('sampleindex');
      state.set({
        cursor: {
          sample,
        },
      });
    });

    target.find('#add-sample').click(() => {
      const sampid = song.addSampleToInstrument(this.cur_instr);
      state.set({
        cursor: {
          sample: sampid,
        },
      });
    });

    target.find('#load-sample').click(() => {
      $('#dialog').empty();
      $('#dialog').append($('<input type=\'file\' id=\'file-input\' />'));
      $('#dialog').dialog({
        width: 500,
        modal: true,
        buttons: {
          Ok: function ok() {
            const { files } = $('#file-input')[0];
            if (files.length > 0) {
              player.loadSampleFromFile(files[0], (audioData, floatData) => {
                const instrumentIndex = state.cursor.get('instrument');
                const sampleIndex = state.cursor.get('sample');
                song.setInstrumentSampleData(instrumentIndex, sampleIndex, floatData);
              });
            }
            $(this).dialog('close');
          },
          Cancel: function cancel() {
            $(this).dialog('close');
          },
        },
      });
    });

    const currSample = state.cursor.get('sample');
    this.scrollToSample(currSample);

    const that = this;
    target.find('.samples-name div').inlineEdit({
      accept: function accept(val) {
        const row = $(this).parents('.samples-row');
        if (row) {
          const sampleindex = row.data('sampleindex');
          song.setInstrumentSampleName(that.cur_instr, sampleindex, val);
        }
      },
    });

    this.lastCursor = state.cursor.toJS();
  }

  refresh() {
    $(this.target).empty();
    this.updateSample();
    this.render();
  }

  updateSample() {
    this.cur_instr = state.cursor.get('instrument');
    this.instrument = song.getInstrument(this.cur_instr);
  }

  scrollToSample(sample) {
    const target = $(this.target);
    target.find('.current-sample').removeClass('current-sample');
    target.find('.samples-row').eq(sample).addClass('current-sample');
    target.find('.samples-list').scrollTop(sample * this.rowHeight);
  }

  onSongChanged() {
    this.updateSample();
    this.refresh();
  }

  onInstrumentChanged(instrumentIndex) {
    if (instrumentIndex === this.cur_instr) {
      this.updateSample();
      this.refresh();
    }
  }

  onCursorChanged() {
    if (state.cursor.get('instrument') !== this.lastCursor.instrument) {
      this.refresh();
    } else if (state.cursor.get('sample') !== this.lastCursor.sample) {
      this.updateSample();

      const currSample = state.cursor.get('sample');
      this.scrollToSample(currSample);
    }
    this.lastCursor = state.cursor.toJS();
  }

  onScroll(e) {
    this.yoff += e.originalEvent.deltaY;
    let row = Math.floor((this.yoff) / this.rowHeight);
    const maxrow = this.instrument.samples.length;
    row = ((row % maxrow) + maxrow) % maxrow;

    if (row !== this.lastCursor.sample) {
      state.set({
        cursor: {
          sample: row,
        },
      });
    }

    e.preventDefault();
  }
}
