import $ from 'jquery';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import mapperTemplate from './templates/sample_mapper.marko';

import styles from './styles.css';

export default class SampleMapper {
  constructor(target) {
    this.target = target;
    this.lastCursor = state.cursor;
    this.zoom = 1;
    this.offset = 0;
    this.left_margin = 10;
    this.top_margin = 10;
    this.bottom_margin = 15;
    this.right_margin = 10;
    this.instrument = undefined;

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
    Signal.connect(song, "songChanged", this, "onSongChanged");
  }

  renderGridAndAxes() {
    const ctx = this.canvas.getContext('2d');

    const height = this.canvas.height;
    const width = this.canvas.width;

    const internalHeight = height - this.bottom_margin - this.top_margin;
    const internalWidth = width - this.left_margin - this.right_margin;

    let vcount = 64;
    let vdelta = internalHeight / vcount;
    while(vdelta <= 10 && vcount > 8) {
      vcount /= 2;
      vdelta = internalHeight/vcount;
    }
    // Grid
    let hcount = 96;
    let hdelta = (internalWidth / hcount) * this.zoom;
    ctx.beginPath();
    ctx.strokeStyle = '#009';
    ctx.lineWidth = 1;
    const xoff = Math.abs(Math.ceil(this.offset/hdelta));
    let x = (this.offset % hdelta) + this.left_margin;
    for(let i = 0; i <= hcount; i += 1) {
      const offi = xoff + i;
      if((offi % 12) !== 0) {
        ctx.moveTo(x, this.top_margin);
        ctx.lineTo(x, this.canvas.height - this.bottom_margin);
      } 
      x += hdelta;
    } 

    let y = this.canvas.height - this.bottom_margin;
    for(let i = 0; i <= vcount; i += 1) {
      ctx.moveTo(this.left_margin, y);
      ctx.lineTo(this.canvas.width - this.right_margin, y);
      y -= vdelta;
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = '#00D';
    ctx.lineWidth = 2;
    x = ((this.offset % hdelta)) + this.left_margin;
    for(let i = 0; i <= hcount; i += 1) {
      const offi = xoff + i;
      if((offi % 12) === 0) {
        ctx.moveTo(x, this.top_margin);
        ctx.lineTo(x, this.canvas.height - this.bottom_margin);
      } 
      x += hdelta;
    } 
    ctx.stroke();

    ctx.fillStyle = '#FFF';
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    x = (this.offset + this.left_margin);
    for(let i = 0; i < 8; i += 1) {
      ctx.fillText(`C-${i}`, x + ((hdelta * 12) / 2), this.canvas.height - this.bottom_margin, (hdelta * 12));
      x += (hdelta * 12);
    }
  }

  redrawGraph() {
    const ctx = this.canvas.getContext('2d');

    const height = this.canvas.height;
    const width = this.canvas.width;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Draw in axes
    this.renderGridAndAxes();
  }



  render() {
    $(this.target).addClass('sample-mapper');

    $(this.target).append(mapperTemplate.renderToString({instrument: this.instrument}));

    const canvas = $(this.target).find('.graph canvas')[0];
    this.canvas = canvas;

    $(canvas).on('mousewheel', this.onScroll.bind(this));
    $(canvas).on('mousemove', this.onMouseMove.bind(this));
    $(canvas).on('mousedown', this.onMouseDown.bind(this));
    $(canvas).on('mouseup', this.onMouseUp.bind(this));
    $(canvas).on('mouseout', this.onMouseOut.bind(this));

    canvas.height = $(this.target).find('.graph').height();
    canvas.width = $(this.target).find('.graph').width();

    this.redrawGraph();
  }

  changeOptions() {
  }

  onScroll(e) {
    const prevOffset = this.offset;
    if (Math.abs(e.originalEvent.deltaY) > Math.abs(e.originalEvent.deltaX)) {
      this.zoom += (e.originalEvent.deltaY/10);
      this.zoom = Math.min(Math.max(this.zoom, 1), 5);
    } else {
      this.offset -= e.originalEvent.deltaX;
    }
    this.offset = Math.min(Math.max(this.offset, -(((this.canvas.width - this.left_margin - this.right_margin) * this.zoom) - this.canvas.width)), 0);

    $(this.canvas).toggleClass('moveable', (((this.maxtick * 1.2) * this.zoom) > this.canvas.width));

    window.requestAnimationFrame(() => this.redrawGraph());

    e.preventDefault();
  }

  onMouseMove(e) {
  }

  onMouseDown(e) {
  }

  onMouseUp(e) {
  }

  onMouseOut(e) {
  }

  setInstrument(instrument) {
    this.instrument = instrument;
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }

  onCursorChanged() {
    if (state.cursor.get("instrument") !== this.lastCursor.get("instrument")) {
      this.setInstrument(song.song.instruments[state.cursor.get("instrument")]);
      this.target.empty();
      this.render();
      this.lastCursor = state.cursor;
    }
  }

  onSongChanged() {
    this.setInstrument(song.song.instruments[state.cursor.get("instrument")]);
    this.refresh();
  }
}
