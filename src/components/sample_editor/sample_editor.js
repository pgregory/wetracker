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
    this.zoom = undefined;
    this.minzoom = undefined;
    this.offset = 0;
    this.yoff = 0;

    this.wave_canvas = document.createElement('canvas');

    this._note_names = [
      "C-", "C#", "D-", "D#", "E-", "F-",
      "F#", "G-", "G#", "A-", "A#", "B-"
    ];

    this.updateSample();

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
    Signal.connect(state, "playingInstrumentsChanged", this, "onPlayingInstrumentsChanged");
    Signal.connect(song, "songChanged", this, "onSongChanged");
    Signal.connect(song, "instrumentChanged", this, "onInstrumentChanged");
  }

  updateSample() {
    this.instrumentIndex = state.cursor.get("instrument");
    this.sampleIndex = state.cursor.get("sample");

    try {
      this.instrument = song.song.instruments[this.instrumentIndex];
      this.sample = song.song.instruments[this.instrumentIndex].samples[this.sampleIndex];
      this.zoom = undefined;
    } catch(e) {
      this.instrument = undefined;
      this.sample = undefined;
    }
  }

  redrawWaveform() {
    this.wave_canvas.height = $('.sample-editor .waveform').height();
    this.wave_canvas.width = $('.sample-editor .waveform').width();

    var width = this.wave_canvas.width;
    var height = this.wave_canvas.height;
    var ctx = this.wave_canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    if (this.sample) {
      var len = this.sample.len;
      var samples = this.sample.sampledata;

      if(this.zoom == null) {
        // Set default zoom to fill the window.
        this.zoom = this.canvas.width / len;
        this.minzoom = this.zoom;
        this.yoff = Math.pow((this.zoom * 100.0), 1/3)*100.0;
        this.minyoff = this.yoff;
      }

      const sampleWindowMin = 0;
      const sampleWindowMax = Math.min(len, sampleWindowMin + (this.canvas.width / this.zoom));
      const pixelsPerSample = this.zoom;
      const sampleStep = Math.max(1, Math.floor((sampleWindowMax - sampleWindowMin) / this.canvas.width));

      ctx.strokeStyle = '#55acff';
      ctx.beginPath();
      ctx.moveTo(0, height/2);
      for (var i = sampleWindowMin; i < sampleWindowMax; i += sampleStep) {
        var x = (i - sampleWindowMin) * pixelsPerSample;
        var y = ((samples[i]*height/2) + height/2);
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      if ((this.sample.type & 0x3) !== 0) {
        this.loopStartMarker = this.sample.loop * pixelsPerSample;
        this.loopEndMarker = ((this.sample.loop + this.sample.looplen) * pixelsPerSample);

        ctx.strokeStyle = "#30fc05";
        ctx.fillStyle = "#30fc05";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.loopStartMarker, 0);
        ctx.lineTo(this.loopStartMarker, this.canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.loopStartMarker, 0);
        ctx.lineTo(this.loopStartMarker + 10, 10);
        ctx.lineTo(this.loopStartMarker, 20);
        ctx.lineTo(this.loopStartMarker, 0);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.loopEndMarker, 0);
        ctx.lineTo(this.loopEndMarker, this.canvas.height);
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

  drawPositions() {
    if(this.positions) {
      const ctx = this.canvas.getContext('2d');
      const len = this.sample.len;
      ctx.strokeStyle = "#F00";
      ctx.lineWidth = 2;
      for(let i = 0; i < this.positions.length; i += 1) {
        const displayPosition = this.positions[i] * this.zoom;
        ctx.beginPath();
        ctx.moveTo(displayPosition, 0);
        ctx.lineTo(displayPosition, this.canvas.height);
        ctx.stroke();
      }
    }
  }

  updateDisplay() {
    this.redrawWaveform();
    this.updateDisplayPositions();
  }

  updateDisplayPositions() {
    const ctx = this.canvas.getContext('2d');
    ctx.drawImage(this.wave_canvas, 0, 0);
    this.drawPositions();
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

    this.canvas = $(this.target).find('.sample-editor .waveform canvas')[0];

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

    $(this.canvas).on("mousedown", this.onMouseDown.bind(this));
    $(this.canvas).on("mouseup", (e) => {
      this.dragging = false;
    });
    $(this.canvas).on("mousemove", this.onMouseMove.bind(this));

    $(this.canvas).on("mousewheel", this.onScroll.bind(this));

    this.canvas.height = $('.sample-editor .waveform').height();
    this.canvas.width = $('.sample-editor .waveform').width();

    this.redrawWaveform();
    this.updateDisplay();
  }

  onMouseDown(e) {
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
  }

  onMouseMove(e) {
    if (this.sample) {
      const len = this.sample.len;
      const pscale = len/this.canvas.width;
      if (this.dragging) {
        const newX = e.offsetX * pscale;
        if (this.dragMarker === 0) {
          this.sample.looplen -= (newX - this.sample.loop);
          this.sample.loop = newX;
        } else {
          this.sample.looplen = newX - this.sample.loop;
        }

        song.updateInstrument(this.instrumentIndex);

        window.requestAnimationFrame(() => this.redrawWaveform());
      }
    }
  }

  onScroll(e) {
    const prevOffset = this.offset;
    if (Math.abs(e.originalEvent.deltaY) > Math.abs(e.originalEvent.deltaX)) {
      this.yoff += e.originalEvent.deltaY;
      this.yoff = Math.min(Math.max(this.yoff, this.minyoff), 1000);
      const k = 4;
      this.zoom = Math.max(this.minzoom, Math.pow((this.yoff/100.0), 3) / 100.0);
    } else {
      this.offset -= e.originalEvent.deltaX;
    }
    const maxoffset = (this.notesize * 96) - (this.canvas.width - this.left_margin - this.right_margin);
    this.offset = Math.min(Math.max(this.offset, -maxoffset), 0);

    window.requestAnimationFrame(() => this.updateDisplay());

    e.preventDefault();
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

      this.updateDisplay();
      this.updateControlPanel();

      this.lastCursor = state.cursor;
    }
  }

  onSongChanged() {
    this.updateSample();
    this.updateDisplay();
    this.updateControlPanel();
  }

  onInstrumentChanged(index) {
    if((this.instrumentIndex != null) && (index == this.instrumentIndex)) {
      this.updateSample();
      this.updateDisplay();
      this.updateControlPanel();
    }
  }

  onPlayingInstrumentsChanged() {
    const playing = state.playingInstruments.get("positions");
    this.positions = [];
    if(playing.has(this.instrumentIndex)) {
      const positions = playing.get(this.instrumentIndex);
      positions.forEach((p, i) => {
        this.positions.push(p.get("position"));
      });
    }
    this.updateDisplayPositions();
  }
}
