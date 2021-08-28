import $ from 'jquery';

import { connect } from '../../utils/signal';
import { state } from '../../state';
import { eventSystem } from '../../utils/events';

import mapperTemplate from './templates/piano.marko';

import './styles.css';

export default class Piano {
  constructor(target) {
    this.target = target;
    this.lastCursor = state.cursor;
    this.left_margin = 10;
    this.top_margin = 5;
    this.bottom_margin = 5;
    this.right_margin = 10;
    this.hitKey = null;
    this.mouseDown = false;
    this.octaveOffset = 0;

    this.whiteKeys = [0, 2, 4, 5, 7, 9, 11];
    this.whiteKeyOutlines = [0, 1, 2, 0, 1, 1, 2];
    this.blackKeys = [1, 3, 6, 8, 10];

    this.playingNotes = [];

    connect(eventSystem, 'noteDown', this, 'onNoteDown');
    connect(eventSystem, 'noteUp', this, 'onNoteUp');
  }

  calculateKeySizes() {
    // Calculate how many octaves we can fit sensibly.
    this.numOctaves = 1;
    this.numWhiteKeys = this.numOctaves * 7 + 1;
    this.numKeys = this.numOctaves * 12 + 1;
    this.keyWidth = this.internalWidth / this.numWhiteKeys;
    while ((this.internalHeight / this.keyWidth < 5.0) && (this.numOctaves < 8)) {
      this.numOctaves += 1;
      this.numWhiteKeys = this.numOctaves * 7 + 1;
      this.numKeys = this.numOctaves * 12 + 1;
      this.keyWidth = this.internalWidth / this.numWhiteKeys;
    }
    this.blackKeyWidth = this.keyWidth * 0.7;
    this.halfBlackKeyWidth = this.blackKeyWidth * 0.5;

    // Store the definition of the three possible white key
    // shapes.
    this.keyOutlines = [
      [
        [0, 0],
        [this.keyWidth - 1 - this.halfBlackKeyWidth, 0],
        [this.keyWidth - 1 - this.halfBlackKeyWidth, this.internalHeight * 0.6],
        [this.keyWidth - 1, this.internalHeight * 0.6],
        [this.keyWidth - 1, this.internalHeight - 4],
        [this.keyWidth - 5, this.internalHeight],
        [4, this.internalHeight],
        [0, this.internalHeight - 4],
        [0, 0],
      ], [
        [this.halfBlackKeyWidth, 0],
        [this.keyWidth - 1 - this.halfBlackKeyWidth, 0],
        [this.keyWidth - 1 - this.halfBlackKeyWidth, this.internalHeight * 0.6],
        [this.keyWidth - 1, this.internalHeight * 0.6],
        [this.keyWidth - 1, this.internalHeight - 4],
        [this.keyWidth - 5, this.internalHeight],
        [4, this.internalHeight],
        [0, this.internalHeight - 4],
        [0, this.internalHeight * 0.6],
        [this.halfBlackKeyWidth, this.internalHeight * 0.6],
        [this.halfBlackKeyWidth, 0],
      ], [
        [this.halfBlackKeyWidth, 0],
        [this.keyWidth - 1, 0],
        [this.keyWidth - 1, this.internalHeight - 4],
        [this.keyWidth - 5, this.internalHeight],
        [4, this.internalHeight],
        [0, this.internalHeight - 4],
        [0, this.internalHeight * 0.6],
        [this.halfBlackKeyWidth, this.internalHeight * 0.6],
        [this.halfBlackKeyWidth, 0],
      ], [
        [0, 0],
        [this.keyWidth - 1, 0],
        [this.keyWidth - 1, this.internalHeight - 4],
        [this.keyWidth - 5, this.internalHeight],
        [4, this.internalHeight],
        [0, this.internalHeight - 4],
        [0, 0],
      ],
    ];
  }

  renderKey(code) {
    const ctx = this.canvas.getContext('2d');

    const adjustedCode = code - (this.octaveOffset * 12);
    const keyInOctave = adjustedCode % 12;
    const octave = Math.floor(adjustedCode / 12);

    let whiteKeyIndex = this.whiteKeys.indexOf(keyInOctave);
    if (whiteKeyIndex >= 0) {
      const x = this.left_margin + ((whiteKeyIndex + (octave * this.whiteKeys.length)) * this.keyWidth);
      const y = this.top_margin;

      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      if (this.playingNotes.indexOf(code) >= 0) {
        ctx.fillStyle = '#888';
      } else {
        ctx.fillStyle = '#FFF';
      }

      ctx.beginPath();
      const keyOutline = (adjustedCode === this.numKeys - 1) ? this.keyOutlines[3] : this.keyOutlines[this.whiteKeyOutlines[whiteKeyIndex]];
      ctx.moveTo(keyOutline[0][0] + x, keyOutline[0][1] + y);
      for (let p = 1; p < keyOutline.length; p += 1) {
        ctx.lineTo(keyOutline[p][0] + x, keyOutline[p][1] + y);
      }
      ctx.stroke();
      ctx.fill();

      if (keyInOctave === 0) {
        ctx.fillStyle = '#444';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${octave + this.octaveOffset}`, x + (this.keyWidth / 2.0), this.internalHeight, this.keyWidth);
      }
    } else {
      const blackKeyIndex = this.blackKeys.indexOf(keyInOctave);
      whiteKeyIndex = this.whiteKeys.indexOf(keyInOctave - 1);
      if (blackKeyIndex >= 0) {
        const x = this.left_margin + ((whiteKeyIndex + (octave * this.whiteKeys.length)) * this.keyWidth);
        const y = this.top_margin;
        const height = this.internalHeight;

        if (this.playingNotes.indexOf(code) >= 0) {
          ctx.fillStyle = '#888';
        } else {
          ctx.fillStyle = '#000';
        }

        const xStart = x + this.keyWidth - this.halfBlackKeyWidth;
        ctx.fillRect(xStart, y, this.blackKeyWidth + 1, height * 0.6);
      }
    }
  }

  renderKeys() {
    // Render all visible keys
    let code = this.octaveOffset * 12;

    for (let key = 0; key < this.numKeys; key += 1) {
      this.renderKey(code);
      code += 1;
    }
  }

  redrawGraph() {
    const ctx = this.canvas.getContext('2d');

    const { height } = this.canvas;
    const { width } = this.canvas;

    this.internalHeight = height - this.bottom_margin - this.top_margin;
    this.internalWidth = width - this.left_margin - this.right_margin;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    this.calculateKeySizes();

    // Draw in keys
    this.renderKeys();
  }

  render() {
    $(this.target).append(mapperTemplate.renderToString({ instrument: this.instrument }));

    const canvas = $(this.target).find('.keys canvas')[0];
    this.canvas = canvas;

    $(canvas).on('mousemove', this.onMouseMove.bind(this));
    $(canvas).on('mousedown', this.onMouseDown.bind(this));
    $(canvas).on('mouseup', this.onMouseUp.bind(this));
    $(canvas).on('mouseout', this.onMouseOut.bind(this));

    $(this.target).find('#octave-up-button').on('click', () => {
      this.octaveOffset = Math.min(this.octaveOffset + 1, 8 - this.numOctaves);
      window.requestAnimationFrame(() => this.redrawGraph());
    });

    $(this.target).find('#octave-down-button').on('click', () => {
      this.octaveOffset = Math.max(this.octaveOffset - 1, 0);
      window.requestAnimationFrame(() => this.redrawGraph());
    });

    window.requestAnimationFrame(() => {
      canvas.height = $(this.target).find('.keys').height();
      canvas.width = $(this.target).find('.keys').width();
      this.redrawGraph();
    });
  }

  findKeyUnderMouse(x, y) {
    // Find which white key was clicked.
    const whiteKey = Math.floor((x - this.left_margin) / this.keyWidth);
    const octave = this.octaveOffset;
    const whiteKeyInOctave = whiteKey % 7;
    const keyOctave = Math.floor(whiteKey / 7) + octave;
    const keyInOctave = this.whiteKeys[whiteKeyInOctave];
    let keyCode = keyInOctave + (keyOctave * 12);

    // Now check if it's actually a black key.
    const sharpIndex = this.blackKeys.indexOf(keyInOctave + 1);
    const flatIndex = this.blackKeys.indexOf(keyInOctave - 1);

    const sharp = sharpIndex >= 0 ? this.blackKeys[sharpIndex] : -1;
    const flat = flatIndex >= 0 ? this.blackKeys[flatIndex] : -1;

    // If there is a flat key, check if the mouse is over it.
    if (flat >= 0) {
      if (x < ((whiteKey * this.keyWidth) + this.left_margin) + this.halfBlackKeyWidth
          && y < this.top_margin + (this.internalHeight * 0.6)) {
        keyCode = flat + (keyOctave * 12);
      }
    }
    // If there is a sharp key, check if the mouse is over it.
    if (sharp >= 0) {
      if (x > (((whiteKey + 1) * this.keyWidth) + this.left_margin) - this.halfBlackKeyWidth
          && y < this.top_margin + (this.internalHeight * 0.6)) {
        keyCode = sharp + (keyOctave * 12);
      }
    }
    return keyCode;
  }

  onMouseDown(e) {
    const x = e.offsetX;
    const y = e.offsetY;

    this.mouseDown = true;

    const keyCode = this.findKeyUnderMouse(x, y);

    this.hitKey = keyCode;
    eventSystem.raise('noteDown', keyCode);
    window.requestAnimationFrame(() => this.redrawGraph());
  }

  onMouseUp() {
    if (this.hitKey !== null) {
      eventSystem.raise('noteUp', this.hitKey);
      this.hitKey = null;
    }

    this.mouseDown = false;
    window.requestAnimationFrame(() => this.redrawGraph());
  }

  onMouseOut() {
  }

  onMouseMove(e) {
    const x = e.offsetX;
    const y = e.offsetY;

    const keyCode = this.findKeyUnderMouse(x, y);

    if (keyCode !== this.hitKey) {
      eventSystem.raise('noteUp', this.hitKey);
      this.hitKey = null;
      if (this.mouseDown) {
        this.hitKey = keyCode;
        eventSystem.raise('noteDown', keyCode);
        window.requestAnimationFrame(() => this.redrawGraph());
      }
    }
  }

  refresh() {
    $(this.target).empty();
    this.hitKey = null;
    this.mouseDown = false;
    this.render();
  }

  onNoteDown(note) {
    this.playingNotes.push(note);
    window.requestAnimationFrame(() => this.redrawGraph());
  }

  onNoteUp(note) {
    const index = this.playingNotes.indexOf(note);
    if (index !== -1) {
      this.playingNotes.splice(index, 1);
      window.requestAnimationFrame(() => this.redrawGraph());
    }
  }
}
