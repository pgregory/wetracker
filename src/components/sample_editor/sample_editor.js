import $ from 'jquery';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import sampleTemplate from './templates/sample.marko';

import styles from './styles.css';

export default class SampleEditor {
  constructor(target) {
    this.target = target;
    this.lastCursor = state.cursor;

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
  }

  render() {
    $(this.target).addClass('sample-editor');
    var cur_instr = state.cursor.get("instrument");
    $(this.target).append(sampleTemplate.renderToString({samples: song.song.instruments[cur_instr].samples}));

    var canvas = $(this.target).find('.sample .waveform canvas')[0];
    canvas.height = $('.sample .waveform').height();
    canvas.width = $('.sample .waveform').width();
    var width = canvas.width;
    var height = canvas.height;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    var sample = song.song.instruments[cur_instr].samples;
    if (sample) {
      var len = sample[0].len;
      var samples = sample[0].sampledata;
      var scale = Math.floor(len/canvas.width);
      ctx.strokeStyle = '#55acff';
      ctx.beginPath();
      ctx.moveTo(0, height/2);
      for (var i = 0; i < Math.min(len/scale, canvas.width); i++) {
        var x = i;
        var y = ((samples[i*scale]*height/2) + height/2);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
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
