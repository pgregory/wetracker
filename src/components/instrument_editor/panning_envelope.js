import $ from 'jquery';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import instrumentTemplate from './templates/instrument.marko';

import styles from './styles.css';

export default class PanningEnvelope {
  constructor(target) {
    this.target = target;
    this.lastCursor = state.cursor;
    this.zoom = 1;
    this.offset = 0;
    this.currentPoint = undefined;
    this.mouseX = undefined;
    this.mouseY = undefined;
    this.dragging = false;
    this.curveX = undefined;
    this.curveY = undefined;
    this.left_margin = 20;
    this.instrument = undefined;

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
  }

  renderGridAndAxes() {
    const ctx = this.canvas.getContext('2d');

    let vcount = 64;
    let vdelta = this.canvas.height/vcount;
    while(vdelta <= 10 && vcount > 8) {
      vcount /= 2;
      vdelta = this.canvas.height/vcount;
    }
    ctx.strokeStyle = '#AAA';
    ctx.beginPath();
    let y = this.canvas.height;
    for(let i = 0; i < vcount; i += 1) {
      ctx.moveTo(this.left_margin, y);
      ctx.lineTo(this.left_margin + 4, y);
      y -= vdelta;
    } 
    ctx.stroke();

    // Grid
    let hcount = this.canvas.width / this.zoom;
    let hdelta = this.canvas.width / hcount;
    while(hdelta < 50 && hcount > 10) {
      hcount /= 2;
      hdelta = this.canvas.width / hcount;
    }
    ctx.strokeStyle = '#00D';
    ctx.beginPath();
    let x = (hdelta + (this.offset % hdelta)) + this.left_margin;
    for(let i = 0; i <= hcount; i += 1) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      x += hdelta;
    } 

    y = this.canvas.height;
    for(let i = 0; i <= vcount/4; i += 1) {
      ctx.moveTo(this.left_margin, y);
      ctx.lineTo(this.canvas.width, y);
      y -= (vdelta * 4);
    }

    ctx.stroke();
  }

  redrawCurve() {
    const ctx = this.canvas.getContext('2d');

    const height = this.canvas.height;
    const width = this.canvas.width;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Draw in axes
    this.renderGridAndAxes();

    const env_pan = this.instrument.env_pan;
    if (env_pan) {
      const len = env_pan.points.length;
      const points = env_pan.points;

      this.maxtick = 0;

      ctx.strokeStyle = '#55acff';
      ctx.beginPath();
      for (let i = 0; i < len; i += 2) {
        const x = (points[i] * this.zoom) + this.offset + this.left_margin;
        const y = (height - ((points[i+1] / 64) * height));
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        this.maxtick = Math.max(this.maxtick, points[i]);
      }
      ctx.stroke();

      for (let i = 0; i < len; i += 2) {
        const pos = this.curvePointToCanvas(i);

        if ((i/2) === this.currentPoint) {
          ctx.strokeStyle = '#F00';
        } else {
          ctx.strokeStyle = '#FFF';
        }
        ctx.strokeRect((pos.px + this.left_margin + this.offset) - 2, pos.py - 2, 5, 5);
      }

      if (this.curveX != null) {
        ctx.save();
        ctx.strokeStyle = '#444';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        const val = this.interpolateCurve(this.curveX);
        const pos = this.curveToCanvas(this.curveX, val);
        ctx.moveTo((pos.px + this.left_margin + this.offset), 0);
        ctx.lineTo((pos.px + this.left_margin + this.offset), this.canvas.height);

        ctx.moveTo(this.left_margin, pos.py);
        ctx.lineTo(this.canvas.width, pos.py);

        ctx.stroke();
        ctx.restore();
      }
    }
  }

  render() {
    $(this.target).addClass('instrument-editor');
    const cur_instr = state.cursor.get("instrument");
    $(this.target).append(instrumentTemplate.renderToString({instrument: song.song.instruments[cur_instr]}));

    this.instrument = song.song.instruments[cur_instr];

    const canvas = $(this.target).find('.instrument .waveform canvas')[0];
    this.canvas = canvas;

    $(canvas).on('mousewheel', this.onScroll.bind(this));
    $(canvas).on('mousemove', this.onMouseMove.bind(this));
    $(canvas).on('mousedown', this.onMouseDown.bind(this));
    $(canvas).on('mouseup', this.onMouseUp.bind(this));
    $(canvas).on('mouseout', this.onMouseOut.bind(this));

    canvas.height = $('.instrument .waveform').height();
    canvas.width = $('.instrument .waveform').width();

    this.redrawCurve();
  }

  onScroll(e) {
    const prevOffset = this.offset;
    if (Math.abs(e.originalEvent.deltaY) > Math.abs(e.originalEvent.deltaX)) {
      this.zoom += (e.originalEvent.deltaY/10);
      this.zoom = Math.min(Math.max(this.zoom, 0.1), 100);
    } else {
      this.offset -= e.originalEvent.deltaX;
    }
    this.offset = Math.min(Math.max(this.offset, -(((this.maxtick * 1.2) * this.zoom) - this.canvas.width)), 0);

    const pos = this.curveFromCanvas(this.mouseX - this.left_margin - this.offset, this.mouseY);
    this.curveX = pos.xcurve;
    this.curveY = pos.ycurve;

    $(this.canvas).toggleClass('moveable', (((this.maxtick * 1.2) * this.zoom) > this.canvas.width));

    window.requestAnimationFrame(() => this.redrawCurve());
    e.preventDefault();
  }

  onMouseMove(e) {
    const xpos = (e.offsetX - this.left_margin) - this.offset;
    const ypos = e.offsetY;

    const pos = this.curveFromCanvas(xpos, ypos);
    this.curveX = pos.xcurve;
    this.curveY = pos.ycurve;

    const point = this.curvePointAtCanvas(xpos, ypos);

    if (this.dragging) {
      if (this.currentPoint) {
        this.setCurvePoint(this.currentPoint, pos.xcurve, pos.ycurve);
      } else {
        this.offset += (e.offsetX - this.mouseX);
        this.offset = Math.min(Math.max(this.offset, -(((this.maxtick * 1.2) * this.zoom) - this.canvas.width)), 0);
      }
    }
    this.mouseX = e.offsetX;
    this.mouseY = e.offsetY;

    if (point != null) {
      $(this.canvas).toggleClass('moveable', false);
      $(this.canvas).toggleClass('dragging', true);
    } else {
      $(this.canvas).toggleClass('dragging', false);
      $(this.canvas).toggleClass('moveable', (((this.maxtick * 1.2) * this.zoom) > this.canvas.width));
    }

    window.requestAnimationFrame(() => this.redrawCurve());
  }

  onMouseDown(e) {
    const xpos = (e.offsetX - this.left_margin) - this.offset;
    const ypos = e.offsetY;

    const pos = this.curveFromCanvas(xpos, ypos);

    const point = this.curvePointAtCanvas(xpos, ypos);
    if (point != null) {
      this.currentPoint = point;
      this.setCurvePoint(this.currentPoint, pos.xcurve, pos.ycurve);
      window.requestAnimationFrame(() => this.redrawCurve());
    } else {
      this.currentPoint = undefined;
    }
    this.dragging = true;
  }

  onMouseUp(e) {
    this.dragging = false;
  }

  onMouseOut(e) {
    this.curveX = undefined;
    window.requestAnimationFrame(() => this.redrawCurve());
  }

  setCurvePoint(index, x, y) {
    let curveX = x;

    if (index > 0) {
      if (curveX <= this.instrument.env_pan.points[(index - 1) * 2]) {
        curveX = this.instrument.env_pan.points[(index - 1) * 2] + 1;
      } else if (index < (this.instrument.env_pan.points.length / 2) &&
                 curveX >= this.instrument.env_pan.points[(index + 1) * 2]) {
        curveX = this.instrument.env_pan.points[(index + 1) * 2] - 1;
      }
    } else {
      // Point 0 must be at tick 0
      curveX = 0;
    }

    this.instrument.env_pan.points[index * 2] = curveX;
    this.instrument.env_pan.points[(index * 2) + 1] = y;
  }

  curvePointToCanvas(pointIndex) {
    const points = this.instrument.env_pan.points;
    const height = this.canvas.height;

    const px = (points[pointIndex] * this.zoom);
    const py = (height - ((points[pointIndex+1] / 64) * height));

    return {px, py};
  }

  curveToCanvas(curvex, curvey) {
    const height = this.canvas.height;

    const px = (curvex * this.zoom);
    const py = (height - ((curvey / 64) * height));

    return {px, py};
  }

  curvePointAtCanvas(x, y) {
    const len = this.instrument.env_pan.points.length;

    for (let i = 0; i < len; i += 2) {
      const p = this.curvePointToCanvas(i);

      if((x > (p.px - 5)) && (x < (p.px + 5)) &&
         (y > (p.py - 5)) && (y < (p.py + 5))) {
        return i/2;
      }
    }
    return null;
  }

  curveFromCanvas(xpos, ypos) {
    const xcurve = Math.round(xpos / this.zoom);
    const ycurve = Math.round((this.canvas.height-ypos) * (64.0 / this.canvas.height));

    return {xcurve, ycurve};
  }

  interpolateCurve(curveX) {
    const points = this.instrument.env_pan.points;
    const len = points.length;

    let prevX = points[0];
    let prevY = points[1];
    let i = 2;
    while(curveX > points[i] && i < len) {
      prevX = points[i];
      prevY = points[i+1];
      i += 2;
    }
    if (i >= len) {
      return prevY;
    }

    const nextX = points[i];
    const nextY = points[i+1];

    const val = (((curveX - prevX) / (nextX - prevX)) * (nextY - prevY)) + prevY;

    return val;
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
