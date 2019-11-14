import $ from 'jquery';

import { connect } from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import sampleTemplate from './templates/sample.marko';

import './styles.css';

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
    this.mouseX = undefined;
    this.mouseY = undefined;

    this.wave_canvas = document.createElement('canvas');

    this.noteName = [
      'C-', 'C#', 'D-', 'D#', 'E-', 'F-',
      'F#', 'G-', 'G#', 'A-', 'A#', 'B-',
    ];

    connect(state, 'cursorChanged', this, 'onCursorChanged');
    connect(state, 'playingInstrumentsChanged', this, 'onPlayingInstrumentsChanged');
    connect(song, 'songChanged', this, 'onSongChanged');
    connect(song, 'instrumentChanged', this, 'onInstrumentChanged');
    connect(song, 'sampleChanged', this, 'onSampleChanged');
  }

  updateSample() {
    this.instrumentIndex = state.cursor.get('instrument');
    this.sampleIndex = state.cursor.get('sample');

    try {
      this.instrument = song.getInstrument(this.instrumentIndex);
      this.sample = this.instrument.samples[this.sampleIndex];
      // Set default zoom to fill the window.
      const { len } = this.sample;
      if (len > 0) {
        this.zoom = this.canvas.width / len;
        this.minzoom = this.zoom;
        this.yoff = ((this.zoom * 100.0) ** (1 / 3)) * 100.0;
        this.minyoff = this.yoff;
        const maxoffset = (this.sample.len * this.zoom) - this.canvas.width;
        this.offset = Math.max(Math.min(this.offset, maxoffset), 0);
      }
    } catch (e) {
      this.instrument = undefined;
      this.sample = undefined;
    }
  }

  redrawWaveform() {
    this.wave_canvas.height = $('.sample-editor .waveform').height();
    this.wave_canvas.width = $('.sample-editor .waveform').width();

    const { width } = this.wave_canvas;
    const { height } = this.wave_canvas;
    const ctx = this.wave_canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    if (this.sample) {
      const { len } = this.sample;
      const samples = this.sample.sampledata.data;

      if (this.zoom == null) {
        // Set default zoom to fill the window.
        this.zoom = this.canvas.width / len;
        this.minzoom = this.zoom;
        this.yoff = ((this.zoom * 100.0) ** (1 / 3)) * 100.0;
        this.minyoff = this.yoff;
      }

      const pixelsPerSample = this.zoom;
      const samplesPerPixel = Math.max(1.0, Math.floor(1.0 / this.zoom));
      // Calculate the sample window in the waveform so we only draw what is visible.
      // Take into account zoom and offset.
      let sampleWindowMin = Math.floor(this.offset / this.zoom);
      // Now adjust the window to the start of the nearest sample 'bin' so that at the same zoom level a pixel
      // shows the same sample as it shifts with the offset, this avoids jittering in the draw as the sample used
      // for each pixel shifts with the horizontal offset.
      sampleWindowMin = Math.floor(sampleWindowMin / samplesPerPixel) * samplesPerPixel;
      const sampleWindowMax = Math.min(len, sampleWindowMin + (this.canvas.width / this.zoom));
      const sampleStep = Math.max(1, Math.floor((sampleWindowMax - sampleWindowMin) / this.canvas.width));

      ctx.strokeStyle = '#55acff';
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      for (let i = sampleWindowMin; i < sampleWindowMax; i += sampleStep) {
        const x = (i - sampleWindowMin) * pixelsPerSample;
        const y = (((samples[i] * height) / 2) + (height / 2));
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      if ((this.sample.type & 0x3) !== 0) { // eslint-disable-line no-bitwise
        this.loopStartMarker = (this.sample.loop - sampleWindowMin) * pixelsPerSample;
        this.loopEndMarker = (((this.sample.loop - sampleWindowMin) + this.sample.looplen) * pixelsPerSample);

        ctx.strokeStyle = '#30fc05';
        ctx.fillStyle = '#30fc05';
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
    if (this.positions && this.sample) {
      const ctx = this.canvas.getContext('2d');
      ctx.strokeStyle = '#F00';
      ctx.lineWidth = 2;
      for (let i = 0; i < this.positions.length; i += 1) {
        const displayPosition = (this.positions[i] * this.zoom) - this.offset;
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
    try {
      const ctx = this.canvas.getContext('2d');
      ctx.drawImage(this.wave_canvas, 0, 0);
      this.drawPositions();
    } catch (e) {
      // It's ok, sometimes the wave_canvas is not visible, so has
      // zero height, an exception is expected, we just need to capture
      // it.
    }
  }

  updateControlPanel() {
    if (this.sample) {
      $(this.target).find('input#basenote').val(this.displayNote(this.sample.note));
      $(this.target).find('input#finetune').val(this.sample.fine);
      $(this.target).find('select#loop').val(this.sample.type);
    } else {
      $(this.target).find('input#basenote').val('---');
      $(this.target).find('input#basenote').val('0');
      $(this.target).find('select#loop').val('0');
    }
  }

  displayNote(note) {
    return this.noteName[(note + 48) % 12] + ~~((note + 48) / 12); // eslint-disable-line no-bitwise
  }

  render() {
    const target = $(this.target);
    target.append(sampleTemplate.renderToString({ sample: this.sample }));

    this.canvas = $(this.target).find('.sample-editor .waveform canvas')[0];

    target.find('button#note-down').click(() => {
      this.sample.note = Math.max(-48, this.sample.note - 1);
      this.updateControlPanel();
    });
    target.find('button#note-up').click(() => {
      this.sample.note = Math.min(96, this.sample.note + 1);
      this.updateControlPanel();
    });
    target.find('button#octave-down').click(() => {
      this.sample.note = Math.max(-48, this.sample.note - 12);
      this.updateControlPanel();
    });
    target.find('button#octave-up').click(() => {
      this.sample.note = Math.min(96, this.sample.note + 12);
      this.updateControlPanel();
    });

    target.find('button#fine-down').click(() => {
      this.sample.fine = Math.max(-128, this.sample.fine - 1);
      this.updateControlPanel();
    });
    target.find('button#fine-up').click(() => {
      this.sample.fine = Math.min(128, this.sample.fine + 1);
      this.updateControlPanel();
    });

    target.find('select#loop').change((e) => {
      const type = $(e.target).val();
      this.sample.type = type;
      if (type !== 0 && this.sample.loop === 0 && this.sample.looplen === 0) {
        this.sample.looplen = this.sample.len;
      }
      this.updateControlPanel();
      song.updateInstrument(this.instrumentIndex, this.instrument);
    });

    $(this.canvas).on('mousedown', this.onMouseDown.bind(this));
    $(this.canvas).on('mouseup', () => {
      if (this.dragging) {
        song.updateInstrument(this.instrumentIndex, this.instrument);
      }
      this.dragging = false;
    });
    $(this.canvas).on('mousemove', this.onMouseMove.bind(this));

    $(this.canvas).on('wheel', this.onScroll.bind(this));

    this.canvas.height = $('.sample-editor .waveform').height();
    this.canvas.width = $('.sample-editor .waveform').width();

    this.redrawWaveform();
    this.updateDisplay();
  }

  onMouseDown(e) {
    const clickX = e.offsetX;
    if ((clickX > (this.loopStartMarker - 5))
        && (clickX < (this.loopStartMarker + 5))) {
      this.dragging = true;
      this.dragMarker = 0;
    } else if ((clickX > (this.loopEndMarker - 5))
        && (clickX < (this.loopEndMarker + 5))) {
      this.dragging = true;
      this.dragMarker = 1;
    } else {
      this.dragging = true;
      this.dragMarker = undefined;
    }
  }

  onMouseMove(e) {
    if (this.sample) {
      if (this.dragging) {
        const newX = Math.floor((e.offsetX + this.offset) / this.zoom);
        if (this.dragMarker === 0) {
          // Dragging the loop start marker
          this.sample.looplen -= (newX - this.sample.loop);
          this.sample.loop = newX;
        } else if (this.dragMarker === 1) {
          // Dragging the loop end marker
          this.sample.looplen = newX - this.sample.loop;
        } else {
          // Dragging the waveform
          this.offset -= (e.offsetX - this.mouseX);
          const maxoffset = (this.sample.len * this.zoom) - this.canvas.width;
          this.offset = Math.max(Math.min(this.offset, maxoffset), 0);
        }
        window.requestAnimationFrame(() => this.updateDisplay());
      }
    }
    this.mouseX = e.offsetX;
    this.mouseY = e.offsetY;
  }

  onScroll(e) {
    if (Math.abs(e.originalEvent.deltaY) > Math.abs(e.originalEvent.deltaX)) {
      this.yoff += e.originalEvent.deltaY;
      this.yoff = Math.min(Math.max(this.yoff, this.minyoff), 1000);
      this.zoom = Math.max(this.minzoom, ((this.yoff / 100.0) ** 3) / 100.0);
    } else {
      this.offset += e.originalEvent.deltaX;
    }
    const maxoffset = (this.sample.len * this.zoom) - this.canvas.width;
    this.offset = Math.max(Math.min(this.offset, maxoffset), 0);

    window.requestAnimationFrame(() => this.updateDisplay());

    e.preventDefault();
  }

  refresh() {
    $(this.target).empty();
    this.render();

    this.updateSample();
    this.updateDisplay();
    this.updateControlPanel();
  }

  onCursorChanged() {
    if ((state.cursor.get('instrument') !== this.lastCursor.get('instrument'))
        || (state.cursor.get('sample') !== this.lastCursor.get('sample'))) {
      this.updateSample();

      try {
        this.updateDisplay();
        this.updateControlPanel();
      } catch (e) {
        console.log(e);
      }

      this.lastCursor = state.cursor;
    }
  }

  onSongChanged() {
    this.updateSample();
    this.updateDisplay();
    this.updateControlPanel();
  }

  onInstrumentChanged(index) {
    if ((this.instrumentIndex != null) && (index === this.instrumentIndex)) {
      this.updateDisplay();
      this.updateControlPanel();
    }
  }

  onSampleChanged(instrumentIndex, sampleIndex) {
    if (((this.instrumentIndex != null) && (instrumentIndex === this.instrumentIndex))
       && ((this.sampleIndex != null) && (sampleIndex === this.sampleIndex))) {
      this.updateSample();
      this.updateDisplay();
      this.updateControlPanel();
    }
  }

  onPlayingInstrumentsChanged() {
    const playing = state.playingInstruments.get('positions');
    this.positions = [];
    if (playing.has(this.instrumentIndex)) {
      const positions = playing.get(this.instrumentIndex);
      positions.forEach((p) => {
        this.positions.push(p.get('position'));
      });
    }
    this.updateDisplayPositions();
  }
}
