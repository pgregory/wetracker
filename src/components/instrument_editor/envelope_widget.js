import $ from 'jquery';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';
import { player } from '../../audio/player';

import envelopeTemplate from './templates/envelope.marko';

export default class EnvelopeWidget {
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
    this.top_margin = 10;
    this.bottom_margin = 10;
    this.instrument = undefined;
    this.envelope = undefined;

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
    Signal.connect(song, "songChanged", this, "onSongChanged");
  }

  renderGridAndAxes() {
    const ctx = this.canvas.getContext('2d');

    const height = this.canvas.height;
    const width = this.canvas.width;

    const internalHeight = height - this.bottom_margin - this.top_margin;

    let vcount = 64;
    let vdelta = internalHeight/vcount;
    while(vdelta <= 10 && vcount > 8) {
      vcount /= 2;
      vdelta = internalHeight/vcount;
    }
    ctx.strokeStyle = '#AAA';
    ctx.beginPath();
    let y = internalHeight;
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

    y = this.canvas.height - this.bottom_margin;
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

    const internalHeight = height - this.bottom_margin - this.top_margin;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Draw in axes
    this.renderGridAndAxes();

    if (this.envelope) {
      const len = this.envelope.points.length;
      const points = this.envelope.points;

      this.maxtick = 0;

      ctx.strokeStyle = '#55acff';
      ctx.beginPath();
      for (let i = 0; i < len; i += 2) {
        const x = (points[i] * this.zoom) + this.offset + this.left_margin;
        const y = (internalHeight - ((points[i+1] / 64) * internalHeight) + this.bottom_margin);
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

      this.intersectVal = undefined;
      if (this.curveX != null) {
        ctx.save();
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        this.intersectVal = this.interpolateCurve(this.curveX);
        const pos = this.curveToCanvas(this.curveX, this.intersectVal);
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

    $(this.target).append(envelopeTemplate.renderToString({instrument: this.instrument, envelope: this.envelope}));

    const canvas = $(this.target).find('.envelope-editor .waveform canvas')[0];
    this.canvas = canvas;

    $(canvas).on('mousewheel', this.onScroll.bind(this));
    $(canvas).on('mousemove', this.onMouseMove.bind(this));
    $(canvas).on('mousedown', this.onMouseDown.bind(this));
    $(canvas).on('mouseup', this.onMouseUp.bind(this));
    $(canvas).on('mouseout', this.onMouseOut.bind(this));

    $(this.target).find("input:checkbox").click((e) => {
      this.changeOptions();
    });
    $(this.target).find("input:text").change((e) => {
      this.changeOptions();
    });

    $(this.target).find("#create-envelope").click((e) => {
      this.createEnvelope(); 
    });

    canvas.height = $(this.target).find('.envelope-editor .waveform').height();
    canvas.width = $(this.target).find('.envelope-editor .waveform').width();

    this.redrawCurve();
  }

  createEnvelope() {
    this.refresh();
    this.changeOptions();
  }

  changeOptions() {
    if (this.envelope) {
      const on = $(this.target).find("input:checkbox#on")[0].checked;

      this.envelope.type = this.envelope.type & 0xFE;
      if (on) {
        this.envelope.type = this.envelope.type | 0x1;
      }

      const sustain = $(this.target).find("input:checkbox#sustain")[0].checked;
      this.envelope.type = (this.envelope.type & 0xFD);
      if (sustain) {
        this.envelope.type = this.envelope.type | 0x2;
      }
      const sustainPoint = parseInt($(this.target).find("input#sustain-point")[0].value);
      this.envelope.sustain = sustainPoint;

      const loop = $(this.target).find("input:checkbox#loop")[0].checked;
      this.envelope.type = (this.envelope.type & 0xFB);
      if (loop) {
        this.envelope.type = this.envelope.type | 0x4;
      }
      const loopStart = parseInt($(this.target).find("input#loop-start-point")[0].value);
      const loopEnd = parseInt($(this.target).find("input#loop-end-point")[0].value);

      this.envelope.loopstart = loopStart;
      this.envelope.loopend = loopEnd;

      song.updateInstrument(this.instrumentIndex, this.instrument);
    }
  }

  onScroll(e) {
    if (this.envelope) {
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
    }
    e.preventDefault();
  }

  onMouseMove(e) {
    if (this.envelope) {
      const xpos = (e.offsetX - this.left_margin) - this.offset;
      const ypos = e.offsetY;

      const pos = this.curveFromCanvas(xpos, ypos);
      this.curveX = pos.xcurve;
      this.curveY = pos.ycurve;

      const point = this.curvePointAtCanvas(xpos, ypos);

      if (this.dragging) {
        if (this.currentPoint != null) {
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
  }

  onMouseDown(e) {
    const xpos = (e.offsetX - this.left_margin) - this.offset;
    const ypos = e.offsetY;

    const pos = this.curveFromCanvas(xpos, ypos);

    const point = this.curvePointAtCanvas(xpos, ypos);
    if (point != null) {
      this.currentPoint = point;
      if (e.altKey) {
        this.deletePointFromCurve(point);
        this.currentPoint = undefined;
        window.requestAnimationFrame(() => this.redrawCurve());
      } else {
        this.setCurvePoint(this.currentPoint, pos.xcurve, pos.ycurve);
        window.requestAnimationFrame(() => this.redrawCurve());
      }
    } else {
      this.currentPoint = undefined;

      if (e.shiftKey && this.intersectVal) {
        this.addPointToCurve(this.curveX, this.intersectVal);
        window.requestAnimationFrame(() => this.redrawCurve());
      }
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

  deletePointFromCurve(point) {
    if (this.envelope) {
      if ( (point*2) < this.envelope.points.length) {
        this.envelope.points.splice((point * 2), 2);
      }
    }

    song.updateInstrument(this.instrumentIndex, this.instrument);
  }

  addPointToCurve(x, y) {
    if (this.envelope) {
      let index = 0; 
      while((index < this.envelope.points.length) && 
            (this.envelope.points[index] < x)) {
       index += 2;
      }
      if (index < this.envelope.points) {
        this.envelope.points.push(x, y);
      } else {
        this.envelope.points.splice(index, 0, x, y);
      }
    }

    song.updateInstrument(this.instrumentIndex, this.instrument);
  }

  setCurvePoint(index, x, y) {
    let curveX = x;

    if (index > 0) {
      if (curveX <= this.envelope.points[(index - 1) * 2]) {
        curveX = this.envelope.points[(index - 1) * 2] + 1;
      } else if (index < (this.envelope.points.length / 2) &&
                 curveX >= this.envelope.points[(index + 1) * 2]) {
        curveX = this.envelope.points[(index + 1) * 2] - 1;
      }
    } else {
      // Point 0 must be at tick 0
      curveX = 0;
    }

    this.envelope.points[index * 2] = curveX;
    this.envelope.points[(index * 2) + 1] = y;

    song.updateInstrument(this.instrumentIndex, this.instrument);
  }

  curvePointToCanvas(pointIndex) {
    const points = this.envelope.points;
    const height = this.canvas.height;
    const internalHeight = height - this.top_margin - this.bottom_margin;

    const px = (points[pointIndex] * this.zoom);
    const py = (internalHeight - ((points[pointIndex+1] / 64) * internalHeight) + this.bottom_margin);

    return {px, py};
  }

  curveToCanvas(curvex, curvey) {
    const height = this.canvas.height;
    const internalHeight = height - this.top_margin - this.bottom_margin;

    const px = (curvex * this.zoom);
    const py = (internalHeight - ((curvey / 64) * internalHeight) + this.bottom_margin);

    return {px, py};
  }

  curvePointAtCanvas(x, y) {
    const len = this.envelope.points.length;

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
    const points = this.envelope.points;
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

  setInstrument(instrumentIndex) {
    this.instrumentIndex = instrumentIndex;
    this.instrument = song.getInstrument(instrumentIndex);
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }

  onCursorChanged() {
    if (state.cursor.get("instrument") !== this.lastCursor.get("instrument")) {
      this.setInstrument(state.cursor.get("instrument"));
      this.target.empty();
      this.render();
      this.lastCursor = state.cursor;
    }
  }

  onSongChanged() {
    this.setInstrument(state.cursor.get("instrument"));
    this.refresh();
  }
}
