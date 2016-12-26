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
    this.instrument = undefined;
    this.loopStartMarker = undefined;
    this.loopEndMarker = undefined;

    this._note_names = [
      "C-", "C#", "D-", "D#", "E-", "F-",
      "F#", "G-", "G#", "A-", "A#", "B-"
    ];

    this.updateSample();

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
    Signal.connect(song, "songChanged", this, "onSongChanged");
    Signal.connect(song, "instrumentChanged", this, "onInstrumentChanged");
  }

  updateSample() {
    this.instrumentIndex = state.cursor.get("instrument");
    this.sampleIndex = state.cursor.get("sample");

    try {
      this.instrument = song.song.instruments[this.instrumentIndex];
      this.sample = song.song.instruments[this.instrumentIndex].samples[this.sampleIndex];
    } catch(e) {
      this.instrument = undefined;
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

      const pscale = len/canvas.width;
      if ((this.sample.type & 0x3) !== 0) {
        this.loopStartMarker = this.sample.loop / pscale;
        this.loopEndMarker = ((this.sample.loop + this.sample.looplen) / pscale);

        ctx.strokeStyle = "#30fc05";
        ctx.fillStyle = "#30fc05";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.loopStartMarker, 0);
        ctx.lineTo(this.loopStartMarker, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.loopStartMarker, 0);
        ctx.lineTo(this.loopStartMarker + 10, 10);
        ctx.lineTo(this.loopStartMarker, 20);
        ctx.lineTo(this.loopStartMarker, 0);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.loopEndMarker, 0);
        ctx.lineTo(this.loopEndMarker, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.loopEndMarker, 0);
        ctx.lineTo(this.loopEndMarker - 10, 10);
        ctx.lineTo(this.loopEndMarker, 20);
        ctx.lineTo(this.loopEndMarker, 0);
        ctx.fill();
      }
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
    const target = $(this.target);
    target.append(sampleTemplate.renderToString({sample: this.sample}));

    var canvas = $(this.target).find('.sample-editor .waveform canvas')[0];

    target.find("button#note-down").click((e) => {
      this.sample.note = Math.max(-48, this.sample.note - 1);
      this.updateControlPanel();
    });
    target.find("button#note-up").click((e) => {
      this.sample.note = Math.min(96, this.sample.note + 1);
      this.updateControlPanel();
    });
    target.find("button#octave-down").click((e) => {
      this.sample.note = Math.max(-48, this.sample.note - 12);
      this.updateControlPanel();
    });
    target.find("button#octave-up").click((e) => {
      this.sample.note = Math.min(96, this.sample.note + 12);
      this.updateControlPanel();
    });

    target.find("button#fine-down").click((e) => {
      this.sample.fine = Math.max(-128, this.sample.fine - 1);
      this.updateControlPanel();
    });
    target.find("button#fine-up").click((e) => {
      this.sample.fine = Math.min(128, this.sample.fine + 1);
      this.updateControlPanel();
    });

    $(canvas).on("mousedown", (e) => {
      const clickX = e.offsetX;
      if ((clickX > (this.loopStartMarker - 5)) &&
          (clickX < (this.loopStartMarker + 5))) {
        this.dragging = true;
        this.dragMarker = 0;
      }
      if ((clickX > (this.loopEndMarker - 5)) &&
          (clickX < (this.loopEndMarker + 5))) {
        this.dragging = true;
        this.dragMarker = 1;
      }
    });

    $(canvas).on("mouseup", (e) => {
      this.dragging = false;
    });

    $(canvas).on("mousemove", (e) => {
      if (this.sample) {
        const len = this.sample.len;
        const pscale = len/canvas.width;
        if (this.dragging) {
          const newX = e.offsetX * pscale;
          if (this.dragMarker === 0) {
            this.sample.looplen -= (newX - this.sample.loop);
            this.sample.loop = newX;
          } else {
            this.sample.looplen = newX - this.sample.loop;
          }
          window.requestAnimationFrame(() => this.redrawWaveform());
        }
      }
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

  onInstrumentChanged(index) {
    if((this.instrumentIndex != null) && (index == this.instrumentIndex)) {
      this.updateSample();
      this.redrawWaveform();
      this.updateControlPanel();
    }
  }
}
