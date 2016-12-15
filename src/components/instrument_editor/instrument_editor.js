import $ from 'jquery';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import instrumentTemplate from './templates/instrument.marko';

import styles from './styles.css';

export default class InstrumentEditor {
  constructor(target) {
    this.target = target;
    this.lastCursor = state.cursor;
    this.zoom = 1;
    this.offset = 0;

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
  }

  render() {
    $(this.target).addClass('instrument-editor');
    const cur_instr = state.cursor.get("instrument");
    $(this.target).append(instrumentTemplate.renderToString({instrument: song.song.instruments[cur_instr]}));

    const canvas = $(this.target).find('.instrument .waveform canvas')[0];
    this.canvas = canvas;

    $(canvas).on('mousewheel', this.onScroll.bind(this));

    canvas.height = $('.instrument .waveform').height();
    canvas.width = $('.instrument .waveform').width();
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw in axes
    let count = 64;
    let delta = canvas.height/count;
    while(delta <= 10 && count > 8) {
      count /= 2;
      delta = canvas.height/count;
    }
    ctx.strokeStyle = '#AAA';
    ctx.beginPath();
    let y = canvas.height;
    for(let i = 0; i < count; i += 1) {
      ctx.moveTo(0, y);
      ctx.lineTo(4, y);
      y -= delta;
    } 
    ctx.stroke();

    let vcount = canvas.width / this.zoom;
    let vdelta = canvas.width / vcount;
    while(vdelta < 50 && vcount > 10) {
      vcount /= 2;
      vdelta = canvas.width / vcount;
    }
    ctx.strokeStyle = '#00D';
    ctx.beginPath();
    let x = this.offset % vdelta;
    for(let i = 0; i <= vcount; i += 1) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      x += vdelta;
    } 
    ctx.stroke();

      

    const env_vol = song.song.instruments[cur_instr].env_vol;
    if (env_vol) {
      const len = env_vol.points.length;
      const points = env_vol.points;

      this.maxtick = 0;

      ctx.strokeStyle = '#55acff';
      ctx.beginPath();
      for (let i = 0; i < len; i += 2) {
        const x = (points[i] * this.zoom) + this.offset;
        const y = (height - ((points[i+1] / 64) * height));
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        this.maxtick = Math.max(this.maxtick, points[i]);
      }
      ctx.stroke();
    }
  }

  onScroll(e) {
    if (Math.abs(e.originalEvent.deltaY) > Math.abs(e.originalEvent.deltaX)) {
      this.zoom += (e.originalEvent.deltaY/10);
      this.zoom = Math.min(Math.max(this.zoom, 0.1), 100);
    } else {
      this.offset -= e.originalEvent.deltaX;
      this.offset = Math.min(Math.max(this.offset, -(((this.maxtick * 1.2) * this.zoom) - this.canvas.width)), 0);
    }

    this.refresh();
    e.preventDefault();
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
