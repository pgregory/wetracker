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

    this._note_names = [
      "C-", "C#", "D-", "D#", "E-", "F-",
      "F#", "G-", "G#", "A-", "A#", "B-"
    ];

    this.updateSample();

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
    Signal.connect(song, "songChanged", this, "onSongChanged");
  }

  updateSample() {
    const cur_instr = state.cursor.get("instrument");
    const cur_sample = state.cursor.get("sample");

    try {
      this.sample = song.song.instruments[cur_instr].samples[cur_sample];
    } catch(e) {
      this.sample = undefined;
    }
  }

  redrawWaveform() {
    var canvas = $(this.target).find('.sample-editor .waveform canvas')[0];
    canvas.height = $('.sample-editor .waveform').height();
    canvas.width = $('.sample-editor .waveform').width();
    var width = canvas.width;
    var height = canvas.height;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (this.sample) {
      var len = this.sample.len;
      var samples = this.sample.sampledata;
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

  updateControlPanel() {
    if(this.sample) {
      $(this.target).find("input#basenote").val(this.noteName(this.sample.note));
      $(this.target).find("input#finetune").val(this.sample.fine);
    } else {
      $(this.target).find("input#basenote").val("---");
      $(this.target).find("input#basenote").val("0");
    }
  }

  noteName(note) {
    return this._note_names[(note + 48) % 12] + ~~((note + 48) / 12);
  }

  render() {
    $(this.target).append(sampleTemplate.renderToString({sample: this.sample}));

    $(this.target).find("button#note-down").click((e) => {
      this.sample.note = Math.max(-48, this.sample.note - 1);
      this.updateControlPanel();
    });
    $(this.target).find("button#note-up").click((e) => {
      this.sample.note = Math.min(71, this.sample.note + 1);
      this.updateControlPanel();
    });
    $(this.target).find("button#octave-down").click((e) => {
      this.sample.note = Math.max(-48, this.sample.note - 12);
      this.updateControlPanel();
    });
    $(this.target).find("button#octave-up").click((e) => {
      this.sample.note = Math.min(71, this.sample.note + 12);
    $(this.target).find("button#fine-down").click((e) => {
      this.sample.fine = Math.max(-128, this.sample.fine - 1);
      this.updateControlPanel();
    });
    $(this.target).find("button#fine-up").click((e) => {
      this.sample.fine = Math.min(128, this.sample.fine + 1);
      this.updateControlPanel();
    });

    this.redrawWaveform();
  }

  refresh() {
    $(this.target).empty();
    this.updateSample();
    this.render();
  }

  onCursorChanged() {
    if ((state.cursor.get("instrument") !== this.lastCursor.get("instrument")) || 
        (state.cursor.get("sample") !== this.lastCursor.get("sample"))) {
      this.updateSample();

      this.redrawWaveform();
      this.updateControlPanel();
      
      this.lastCursor = state.cursor;
    }
  }

  onSongChanged() {
    this.updateSample();
    this.redrawWaveform();
    this.updateControlPanel();
  }
}
