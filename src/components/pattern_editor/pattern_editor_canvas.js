import $ from 'jquery';

import styles from './styles.css';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import fontimage from '../../../static/ft2font.png';

// t = current time
// b = start value
// c = change in value
// d = duration
function easeInOutQuad(tc, b, c, d) {
  let t = tc;
  t /= d / 2;
  if (t < 1) return (((c / 2) * t) * t) + b;
  t -= 1;
  return ((-c / 2) * ((t * (t - 2)) - 1)) + b;
}

export default class PatternEditorCanvas {
  constructor(canvas) {
    this.yoff = 0;
    this.lastCursor = state.cursor;
    this.events = null;
    this.rendered = false;

    this.canvas = canvas;

    this._pattern_row_height = 12;
    this._pattern_character_width = 8;
    this._pattern_spacing = 4;
    this._pattern_header_height = 50;
    this._timeline_right_margin = 5;
    this._scope_width = 100;
    this._event_left_margin = 4;
    this._event_right_margin = 4;
    this._element_spacing = 4;
    this._pattern_note_width = this._pattern_character_width * 3;
    this._pattern_inst_width = this._pattern_character_width * 2;
    this._pattern_volu_width = this._pattern_character_width * 2;
    this._pattern_effe_width = (this._pattern_character_width * 4);
    this._cursor_offsets = [
      this._pattern_note_width + this._element_spacing,
      this._pattern_character_width,
      this._pattern_character_width + this._element_spacing,
      this._pattern_character_width,
      this._pattern_character_width + this._element_spacing,
      this._pattern_character_width,
      this._pattern_character_width + 2,
      this._pattern_character_width,
      this._pattern_character_width,
    ];
    this._cursor_sizes = [
      this._pattern_note_width,
      this._pattern_character_width,
      this._pattern_character_width,
      this._pattern_character_width,
      this._pattern_character_width,
      this._pattern_character_width,
      this._pattern_character_width,
      this._pattern_character_width,
      this._pattern_character_width,
    ];
    // N-O II VV EFF
    this._pattern_cellwidth = this._event_left_margin + 
                              (this._pattern_note_width + this._element_spacing) + 
                              (this._pattern_inst_width + this._element_spacing) + 
                              (this._pattern_volu_width + this._element_spacing) +
                              (this._pattern_effe_width + this._element_spacing) +
                              this._event_right_margin;

    this._note_names = [
      [96,288], [96,296], [104,288], [104,296], [112,288], [120,288],
      [120,296], [128,288], [128,296], [80,288], [80,296], [88,288]
    ];

    // Load font (ripped from FastTracker 2)
    this.fontloaded = false;
    this.fontimg = new window.Image();
    this.fontimg.onload = () => this.imageLoaded();
    this.fontimg.src = fontimage;

    this._fontmap_notes = [8*5, 8*22, 8*28];
    this.pat_canvas_patnum;

    this.audio_events;
    this.paused_events;
    this.shown_row;
    this.shown_track;
    this.shown_column;
    this.shown_row;
    this.xoffset;

    // canvas to render patterns onto
    this.pat_canvas = document.createElement('canvas');

    this.empty_event_canvas = document.createElement('canvas');
    this.empty_event_canvas.height = this._pattern_row_height;
    this.empty_event_canvas.width = this._pattern_cellwidth;

    this.timeline_canvas = document.createElement('canvas');
    this.timeline_canvas.height = this._pattern_row_height * 99;
    this.timeline_canvas.width = 30;

    this.hscroll = $(canvas).closest('.hscroll');
    $(canvas).on('mousewheel', this.onScroll.bind(this));

    var gfxpattern = document.getElementById("gfxpattern");
    gfxpattern.width = this.timeline_canvas.width + this._timeline_right_margin + (this._pattern_cellwidth * song.song.tracks.length);

    // reset display
    this.shown_row = undefined;
    this.pat_canvas_patnum = undefined;

    this.audio_events = [];
    this.paused_events = [];
    this.render();

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
    Signal.connect(song, "eventChanged", this, "onEventChanged");
  }

  imageLoaded() {
    this.fontloaded = true;

    var ctx = this.empty_event_canvas.getContext('2d');
    var dx = 0;
    var cw = this._pattern_character_width;
    var rh = this._pattern_row_height;

    // render note
    ctx.drawImage(this.fontimg, 8*39, 0, 8, 8, dx, 0, this._pattern_note_width, 8);
    dx += this._pattern_note_width + this._pattern_spacing;
    dx += this._pattern_inst_width + this._pattern_spacing;
    // render volume
    ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx, 0, cw, 8);
    ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx+cw, 0, cw, 8);
    dx += this._pattern_volu_width + this._pattern_spacing;
    // render effect
    ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx, 0, cw, 8);
    ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx+cw, 0, cw, 8);
    ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx+cw+cw+2, 0, cw, 8);
    ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx+cw+cw+2+cw, 0, cw, 8);

    var ctx = this.timeline_canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.timeline_canvas.width, this.timeline_canvas.height);
    dx = 0;
    for (var j = 0; j < 99; j++) {
      var dy = j * rh + ((rh - 8)/2);
      // render row number
      ctx.drawImage(this.fontimg, 8*(j>>4), 0, 8, 8, 2, dy, 8, 8);
      ctx.drawImage(this.fontimg, 8*(j&15), 0, 8, 8, 10, dy, 8, 8);
    }
  };

  eventPositionInPatternCanvas(cursor) {
    var cx = this._event_left_margin + (cursor.track * this._pattern_cellwidth);
    var cy = cursor.row * this._pattern_row_height + ((this._pattern_row_height - 8)/2);
    return {
      cx,
      cy,
    };
  }

  renderEvent(ctx, col, dx, dy) {
    var cw = this._pattern_character_width;
    var rh = this._pattern_row_height;
    if ((!col.note || note === -1) &&
        (!col.instrument || col.instrument === -1) &&
        (!col.volume || col.volume < 0x10) &&
        (!col.fxtype || col.fxtype === 0) &&
        (!col.fxparam || col.fxparam === 0)) {
      ctx.drawImage(this.empty_event_canvas, dx, dy);
    } else {
      // render note
      var note = col.note;
      if (note == null || note === -1) {
        // no note = ...
        ctx.drawImage(this.fontimg, 8*39, 0, 8, 8, dx, dy, this._pattern_note_width, 8);
      } else {
        var notechars = this._note_names[note%12];
        var octavechar = ~~(note/12) * 8;
        ctx.drawImage(this.fontimg, notechars[0], 0, 8, 8, dx, dy, 8, 8);
        ctx.drawImage(this.fontimg, notechars[1], 0, 8, 8, dx + cw, dy, 8, 8);
        ctx.drawImage(this.fontimg, octavechar, 0, 8, 8, dx + (cw*2), dy, 8, 8);
      }
      dx += this._pattern_note_width + this._element_spacing;

      // render instrument
      var inst = col.instrument;
      if (inst && inst != -1) {  // no instrument = render nothing
        ctx.drawImage(this.fontimg, 8*(inst>>4), 0, 8, 8, dx, dy, 8, 8);
        ctx.drawImage(this.fontimg, 8*(inst&15), 0, 8, 8, dx+cw, dy, 8, 8);
      }
      dx += this._pattern_inst_width + this._element_spacing;

      // render volume
      var vol = col.volume;
      if (vol == null || vol < 0x10) {
        // no volume = ..
        ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx, dy, cw, 8);
        ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx+cw, dy, cw, 8);
      } else {
        ctx.drawImage(this.fontimg, 8*(vol>>4), 0, 8, 8, dx, dy, cw, 8);
        ctx.drawImage(this.fontimg, 8*(vol&15), 0, 8, 8, dx+cw, dy, cw, 8);
      }
      dx += this._pattern_volu_width + this._element_spacing;

      // render effect
      var eff = col.fxtype;
      var effdata = col.fxparam;
      if ((eff && eff !== 0) || (effdata && effdata !== 0)) {
        // draw effect with tiny font (4px space + effect type 0..9a..z)
        if (eff > 15) {
          ctx.drawImage(this.fontimg, 8*(eff>>4), 0, 8, 8, dx, dy, cw, 8);
        } else {
          ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx, dy, cw, 8);
        }
        ctx.drawImage(this.fontimg, 8*(eff&15), 0, 8, 8, dx+cw, dy, cw, 8);
        dx += cw*2+2;
        // (hexadecimal 4-width font)
        ctx.drawImage(this.fontimg, 8*(effdata>>4), 0, 8, 8, dx, dy, cw, 8);
        ctx.drawImage(this.fontimg, 8*(effdata&15), 0, 8, 8, dx+cw, dy, cw, 8);
      } else {
        // no effect = ...
        ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx, dy, cw, 8);
        ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx+cw, dy, cw, 8);
        ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx+cw+cw+2, dy, cw, 8);
        ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx+cw+cw+2+cw, dy, cw, 8);
      }
    }
  }

  renderPattern(patternid) {
    var cw = this._pattern_character_width;
    var rh = this._pattern_row_height;

    // a pattern consists of NxM cells which look like
    // N-O II VV EFF
    var cellwidth = this._pattern_cellwidth;
    var ctx = this.pat_canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle='#000';
    ctx.fillRect(0, 0, this.pat_canvas.width, this.pat_canvas.height);

    var pattern = song.song.patterns[patternid];

    this.pat_canvas.width = song.song.tracks.length * cellwidth;
    this.pat_canvas.height = pattern.numrows * rh;

    for (var j = 0; j < pattern.numrows; j++) {
      var row = pattern.rows[j];
      var dy = j * rh + ((rh - 8)/2);
      var displayColumn = 0;

      for (var tracki = 0; tracki < song.song.tracks.length; tracki += 1) {
        var trackinfo = song.song.tracks[tracki];
        var track = row[trackinfo.id];
        for (var coli = 0; coli < trackinfo.columns.length; coli += 1) {
          var colinfo = trackinfo.columns[coli];
          if (track) {
            var col = track.notedata[colinfo.id];
            if (col) {
              var dx = (displayColumn*cellwidth) + this._event_left_margin;
              this.renderEvent(ctx, col, dx, dy);
            } else {
              // Render empty column
            }
          } else {
            // Render empty track
          }
        }
        displayColumn += 1;
      }
    }
  }

  render() {
    if(!this.fontloaded) {
      window.requestAnimationFrame(() => this.render() );
      return;
    }
    if (state.cursor.get("row") !== this.shown_row || 
        state.cursor.get("pattern") !== this.pat_canvas_patnum ||
        state.cursor.get("track") !== this.shown_track ||
        state.cursor.get("column") !== this.shown_column ||
        state.cursor.get("item") !== this.shown_item ||
        this.hscroll.scrollLeft() !== this.xoffset) {
      if (state.cursor.get("pattern") !== this.pat_canvas_patnum) {
        var p = song.song.patterns[state.cursor.get("pattern")];
        if (p) {
          this.renderPattern(state.cursor.get("pattern"));
          this.pat_canvas_patnum = state.cursor.get("pattern");
        }
      }

      var gfx = document.getElementById("gfxpattern");
      var ctx = gfx.getContext('2d');

      var patternheight = gfx.height - this._pattern_header_height;

      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, gfx.width, gfx.height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(this.pat_canvas, this.timeline_canvas.width + this._timeline_right_margin, gfx.height / 2 - (this._pattern_row_height/2) - this._pattern_row_height*(state.cursor.get("row")));
      ctx.fillStyle = '#000';
      ctx.clearRect(0, 0, gfx.width, this._pattern_header_height);
      ctx.font = "16px monospace";
      ctx.textAlign = "center";
      for(var i = 0; i < song.song.tracks.length; i += 1) {
        var dx = this.timeline_canvas.width + this._timeline_right_margin + (i * this._pattern_cellwidth);
        ctx.fillStyle = '#000';
        ctx.fillRect(dx, 0, this._pattern_cellwidth, this._pattern_header_height);
        ctx.fillStyle = '#FFF';
        var trackname = song.song.tracks[i].name;
        ctx.fillText(trackname, dx + (this._pattern_cellwidth/2), 15, this._pattern_cellwidth);
      }

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFF';
      ctx.beginPath();
      ctx.moveTo(this.timeline_canvas.width + 1, 0);
      ctx.lineTo(gfx.width, 0);
      ctx.lineTo(gfx.width, gfx.height);
      ctx.lineTo(this.timeline_canvas.width + 1, gfx.height);
      //ctx.lineTo(this.timeline_canvas.width + this._timeline_right_margin, 0);
      for(var i = 1; i < song.song.tracks.length; i += 1) {
        var dx = this.timeline_canvas.width + this._timeline_right_margin + (i * this._pattern_cellwidth);
        ctx.moveTo(dx, 0);
        ctx.lineTo(dx, gfx.height);
      }
      ctx.moveTo(this.hscroll.scrollLeft() + this.timeline_canvas.width + 1, 0);
      ctx.lineTo(this.hscroll.scrollLeft() + this.timeline_canvas.width + 1, gfx.height);
      ctx.stroke();

      // Draw the timline fixed to the left of the view.
      var tlw = this.timeline_canvas.width;
      var tlh = this._pattern_row_height * song.song.patterns[state.cursor.get("pattern")].numrows;
      ctx.fillStyle = '#000';
      ctx.fillRect(this.hscroll.scrollLeft(),0, this.timeline_canvas.width, gfx.height);
      ctx.drawImage(this.timeline_canvas, 0, 0, tlw, tlh, this.hscroll.scrollLeft(), gfx.height / 2 - (this._pattern_row_height/2) - this._pattern_row_height*(state.cursor.get("row")), tlw, tlh);
      ctx.fillRect(this.hscroll.scrollLeft(),0, this.timeline_canvas.width, this._pattern_header_height);

      // Draw the cursor row.
      var cy = gfx.height/2 - (this._pattern_row_height/2);
      ctx.globalCompositeOperation = 'lighten';
      ctx.fillStyle = '#2a5684';
      ctx.fillRect(0, cy, gfx.width, this._pattern_row_height);

      // Draw the individual cursor
      ctx.fillStyle = '#0F0';
      ctx.globalCompositeOperation = 'darken';
      var cx = this.timeline_canvas.width + this._timeline_right_margin + this._event_left_margin;
      cx += state.cursor.get("track") * this._pattern_cellwidth;
      for(var i = 0; i < state.cursor.get("item"); i += 1) {
        cx += this._cursor_offsets[i];
      }
      ctx.fillRect(cx, cy, this._cursor_sizes[state.cursor.get("item")], this._pattern_row_height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#0F0';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx-1, cy-1, this._cursor_sizes[state.cursor.get("item")]+2, this._pattern_row_height+2);


      this.shown_row = state.cursor.get("row");
      this.shown_track = state.cursor.get("track");
      this.shown_column = state.cursor.get("column");
      this.shown_item = state.cursor.get("item");
      this.xoffset = this.hscroll.scrollLeft();
    }
  }

  onScroll(e) {
    if (Math.abs(e.originalEvent.deltaY) > Math.abs(e.originalEvent.deltaX)) {
      this.yoff += e.originalEvent.deltaY;
      var row = Math.floor((this.yoff) / 15.0);
      var maxrow = song.song.patterns[state.cursor.get('pattern')].numrows;
      row = ((row % maxrow) + maxrow) % maxrow;
      state.set({
        cursor: {
          row
        }
      });
    } else {
      this.hscroll.scrollLeft(this.hscroll.scrollLeft() + e.originalEvent.deltaX);
      this.render();
    }
    e.preventDefault();
  }

  /* eslint no-param-reassign: ["error", { "props": false }]*/
  scrollHorizTo(element, to, duration) {
    const start = element.scrollLeft;
    const change = to - start;
    let currentTime = 0;
    const increment = 20;

    function animateScroll() {
      currentTime += increment;
      element.scrollLeft = easeInOutQuad(currentTime, start, change, duration);
      if (currentTime < duration) {
        setTimeout(animateScroll, increment);
      }
    }
    animateScroll();
  }

  onCursorChanged(state) {
    window.requestAnimationFrame(this.render.bind(this));
  }

  onEventChanged(cursor, event) {
    var pos = this.eventPositionInPatternCanvas(cursor);
    var ctx = this.pat_canvas.getContext('2d');
    this.renderEvent(ctx, event, pos.cx, pos.cy);
  }
}

