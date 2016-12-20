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
    this.selectedSegment = undefined;

    this.segments = [];

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
    Signal.connect(song, "songChanged", this, "onSongChanged");
  }

  renderGridAndAxes() {
    const ctx = this.canvas.getContext('2d');

    let vcount = 64;
    let vdelta = this.internalHeight / vcount;
    while(vdelta <= 10 && vcount > 8) {
      vcount /= 2;
      vdelta = this.internalHeight/vcount;
    }
    // Grid
    ctx.beginPath();
    ctx.strokeStyle = '#009';
    ctx.lineWidth = 1;
    const xoff = Math.abs(Math.ceil(this.offset/this.hdelta));
    let x = (this.offset % this.hdelta) + this.left_margin;
    const hcount = 96;
    for(let i = 0; i <= hcount; i += 1) {
      const offi = xoff + i;
      if((offi % 12) !== 0) {
        ctx.moveTo(x, this.top_margin);
        ctx.lineTo(x, this.canvas.height - this.bottom_margin);
      } 
      x += this.hdelta;
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
    x = ((this.offset % this.hdelta)) + this.left_margin;
    for(let i = 0; i <= hcount; i += 1) {
      const offi = xoff + i;
      if((offi % 12) === 0) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.canvas.height);
      } 
      x += this.hdelta;
    } 
    ctx.stroke();

    ctx.fillStyle = '#FFF';
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    x = (this.offset + this.left_margin);
    for(let i = 0; i < 8; i += 1) {
      ctx.fillText(`${i}`, x + ((this.hdelta * 12) / 2), this.canvas.height - this.bottom_margin, (this.hdelta * 12));
      x += (this.hdelta * 12);
    }
  }

  redrawGraph() {
    const ctx = this.canvas.getContext('2d');

    const height = this.canvas.height;
    const width = this.canvas.width;

    this.internalHeight = height - this.bottom_margin - this.top_margin;
    this.internalWidth = width - this.left_margin - this.right_margin;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    let hcount = 96;
    this.hdelta = (this.internalWidth / hcount) * this.zoom;

    // Draw in axes
    this.renderGridAndAxes();

    // Now draw in boxes for each range
    if(this.segments && this.segments.length > 0) {
      ctx.save();
      ctx.fillStyle = '#090';
      ctx.strokeStyle = '#0F0';
      ctx.lineWidth = 2;
      const height = this.canvas.height;
      const width = this.canvas.width;

      let x = this.offset + this.left_margin;
      let w = 0;
      let i = 0;

      for(let i = 0; i < this.segments.length; i += 1) {
        const x = this.segments[i].start * this.hdelta + this.offset + this.left_margin;
        const w = this.segments[i].end * this.hdelta + this.offset + this.left_margin - x;

        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillRect(x, this.top_margin, w, this.internalHeight);
        ctx.globalAlpha = 1.0;
        ctx.strokeRect(x, this.top_margin, w, this.internalHeight);
        ctx.fillStyle = "#0F0";
        ctx.globalAlpha = 1.0;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.font = "16px monospace";
        ctx.fillText(`${this.segments[i].instrument}`, (x + (w / 2)), this.top_margin + (this.internalHeight / 2));
        ctx.restore();
      }

      if(this.selectedSegment != null) {
        const x = this.segments[this.selectedSegment].start * this.hdelta + this.offset + this.left_margin;
        const w = this.segments[this.selectedSegment].end * this.hdelta + this.offset + this.left_margin - x;
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.fillRect(x, this.top_margin, w, this.internalHeight);
        ctx.globalAlpha = 1.0;
        ctx.strokeStyle = "#000";
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x, this.top_margin, w, this.internalHeight);
        ctx.restore();
      }
      ctx.restore();
    }
  }

  render() {
    $(this.target).append(mapperTemplate.renderToString({instrument: this.instrument}));

    const canvas = $(this.target).find('.graph canvas')[0];
    this.canvas = canvas;

    $(canvas).on('mousewheel', this.onScroll.bind(this));
    $(canvas).on('mousemove', this.onMouseMove.bind(this));
    $(canvas).on('mousedown', this.onMouseDown.bind(this));
    $(canvas).on('mouseup', this.onMouseUp.bind(this));
    $(canvas).on('mouseout', this.onMouseOut.bind(this));

    $(this.target).find('#set-sample').click((e) => {
      this.setSegmentSample();
    });

    canvas.height = $(this.target).find('.graph').height();
    canvas.width = $(this.target).find('.graph').width();

    this.redrawGraph();
  }

  updateSegments() {
    this.segments = [];
    if(this.instrument) { 
      let b = 0;
      let w = 0;
      let i = 0;
      while(i < 96) {
        let s = this.instrument.samplemap[i];
        while(i < 96 && s == this.instrument.samplemap[i]) {
          i += 1;
          w += 1;
        }

        this.segments.push({
          instrument: s,
          start: b,
          end: b + w,
        });

        b += w;
        w = 0;
      }
    }
  }

  saveSegments() {
    if(this.instrument) {
      this.instrument.samplemap = new Uint8Array(96);
      for(let i = 0; i < this.segments.length; i += 1) {
        this.instrument.samplemap.fill(this.segments[i].instrument, this.segments[i].start, this.segments[i].end);
      }
    }
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
    if(this.dragging) {
      const x = (e.offsetX - this.left_margin) - this.offset;
      const xnote = Math.round(x / this.hdelta);
      const currSeg = this.segments[this.selectedSegment];
      if(this.selectedEdge == 0 && this.selectedSegment > 0 && xnote > 0) {
        currSeg.start = xnote;
        this.segments[this.selectedSegment - 1].end = xnote;
      } else if(this.selectedEdge == 1 && this.selectedSegment < (this.segments.length - 1) && xnote < 96) {
        currSeg.end = xnote;
        this.segments[this.selectedSegment + 1].start = xnote;
      }
      this.saveSegments();
      window.requestAnimationFrame(() => this.redrawGraph());
    }
  }

  onMouseDown(e) {
    const x = (e.offsetX - this.left_margin) - this.offset;
    const y = e.offsetY;

    if(!this.dragging) {
      this.selectedSegment = this.findSegmentAtPosition(x, y);
    }

    if(this.selectedSegment != null) {
      const segx1 = this.segments[this.selectedSegment].start * this.hdelta;
      const segx2 = this.segments[this.selectedSegment].end * this.hdelta;
      if((x > (segx1 - 2)) && (x < (segx1 + 2))) {
        this.dragging = true;
        this.selectedEdge = 0;
      } else if((x > (segx2 - 2)) && (x < (segx2 + 2))) {
        this.dragging = true;
        this.selectedEdge = 1;
      } else {
        // Shift click adds a new segment
        if(e.shiftKey) {
          this.splitSegmentAt(x);
        } else if(e.altKey) {
          this.deleteSegment(this.selectedSegment);
        } 
      }
    } 

    this.redrawGraph();
  }

  onMouseUp(e) {
    this.dragging = false;
  }

  onMouseOut(e) {
  }

  findSegmentAtPosition(x, y) {
    for(let i = 0; i < this.segments.length; i += 1) {
      const minx = this.segments[i].start * this.hdelta;
      const maxx = this.segments[i].end * this.hdelta;

      if(x >= minx && x <= maxx) {
        return i;
      }
    }
  }

  splitSegmentAt(x) {
    if(this.selectedSegment != null) {
      const xnote = Math.round(x / this.hdelta);
      const currSeg = this.segments[this.selectedSegment];
      this.segments.splice(this.selectedSegment + 1, 0, {
        instrument: 0, 
        start: xnote,
        end: currSeg.end,
      });
      currSeg.end = xnote;
      this.saveSegments();
      window.requestAnimationFrame(() => this.redrawGraph());
    } 
  }

  deleteSegment(s) {
    if(this.segments.length > 1) {
      if(s < (this.segments.length - 1)) {
        this.segments[s + 1].start = this.segments[s].start;
      } else {
        this.segments[s - 1].end = this.segments[s].end;
      }
      this.segments.splice(s, 1);
      this.saveSegments();
      this.selectedSegment = undefined;
      window.requestAnimationFrame(() => this.redrawGraph());
    }
  }

  setSegmentSample() {
    if(this.selectedSegment != null) {
      const currSeg = this.segments[this.selectedSegment];
      currSeg.instrument = state.cursor.get("sample");

      this.saveSegments();
      window.requestAnimationFrame(() => this.redrawGraph());
    }
  }

  setInstrument(instrument) {
    this.instrument = instrument;
    this.updateSegments();
  }

  refresh() {
    $(this.target).empty();
    this.updateSegments();
    this.render();
  }

  onCursorChanged() {
    if (state.cursor.get("instrument") !== this.lastCursor.get("instrument")) {
      this.setInstrument(song.song.instruments[state.cursor.get("instrument")]);
      this.selectedSegment = undefined;
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