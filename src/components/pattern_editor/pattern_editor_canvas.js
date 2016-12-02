import $ from 'jquery';

import styles from '../../styles.css';

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
    this._pattern_note_width = this._pattern_character_width * 3;
    this._pattern_inst_width = this._pattern_character_width * 2;
    this._pattern_volu_width = this._pattern_character_width * 2;
    this._pattern_effe_width = (this._pattern_character_width * 4) + 2;
    // N-O II VV EFF
    this._pattern_cellwidth = (this._pattern_note_width + this._pattern_spacing) + 
                              (this._pattern_inst_width + this._pattern_spacing) + 
                              (this._pattern_volu_width + this._pattern_spacing) +
                              (this._pattern_effe_width + this._pattern_spacing);
    this._scope_width = 100;
    this._pattern_border = 20;

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

    // canvas to render patterns onto
    this.pat_canvas = document.createElement('canvas');

    this.empty_event_canvas = document.createElement('canvas');
    this.empty_event_canvas.height = this._pattern_row_height;
    this.empty_event_canvas.width = this._pattern_cellwidth;


    var gfxpattern = document.getElementById("gfxpattern");
    gfxpattern.width = this._pattern_cellwidth * song.song.tracks.length + this._pattern_border;

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
  };

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

    this.pat_canvas.width = song.song.tracks.length * cellwidth + this._pattern_border;
    this.pat_canvas.height = pattern.numrows * rh;

    for (var j = 0; j < pattern.numrows; j++) {
      var row = pattern.rows[j];
      var dy = j * rh + ((rh - 8)/2);
      // render row number
      ctx.drawImage(this.fontimg, 8*(j>>4), 0, 8, 8, 2, dy, 8, 8);
      ctx.drawImage(this.fontimg, 8*(j&15), 0, 8, 8, 10, dy, 8, 8);

      var displayColumn = 0;

      for (var tracki = 0; tracki < song.song.tracks.length; tracki += 1) {
        var trackinfo = song.song.tracks[tracki];
        var track = row[trackinfo.id];
        for (var coli = 0; coli < trackinfo.columns.length; coli += 1) {
          var colinfo = trackinfo.columns[coli];
          if (track) {
            var col = track.notedata[colinfo.id];
            if (col) {
              var dx = displayColumn*cellwidth + 2 + this._pattern_border;

              if ((!col.note || note === -1) &&
                  (!col.instrument || col.instrument === -1) &&
                  (!col.volume || col.volume < 0x10) &&
                  (!col.fxtype || col.fxtype === 0) &&
                  (!col.fxparam || col.fxparam === 0)) {
                ctx.drawImage(this.empty_event_canvas, dx, dy);
              } else {
                // render note
                var note = col.note;
                if (!note || note === -1) {
                  // no note = ...
                  ctx.drawImage(this.fontimg, 8*39, 0, 8, 8, dx, dy, this._pattern_note_width, 8);
                } else {
                  var notechars = this._note_names[note%12];
                  var octavechar = ~~(note/12) * 8;
                  ctx.drawImage(this.fontimg, notechars[0], 0, 8, 8, dx, dy, 8, 8);
                  ctx.drawImage(this.fontimg, notechars[1], 0, 8, 8, dx + cw, dy, 8, 8);
                  ctx.drawImage(this.fontimg, octavechar, 0, 8, 8, dx + (cw*2), dy, 8, 8);
                }
                dx += this._pattern_note_width + this._pattern_spacing;

                // render instrument
                var inst = col.instrument;
                if (inst && inst != -1) {  // no instrument = render nothing
                  ctx.drawImage(this.fontimg, 8*(inst>>4), 0, 8, 8, dx, dy, 8, 8);
                  ctx.drawImage(this.fontimg, 8*(inst&15), 0, 8, 8, dx+cw, dy, 8, 8);
                }
                dx += this._pattern_inst_width + this._pattern_spacing;

                // render volume
                var vol = col.volumne;
                if (!vol || vol < 0x10) {
                  // no volume = ..
                  ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx, dy, cw, 8);
                  ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx+cw, dy, cw, 8);
                } else {
                  ctx.drawImage(this.fontimg, 8*(vol>>4), 0, 8, 8, dx, dy, cw, 8);
                  ctx.drawImage(this.fontimg, 8*(vol&15), 0, 8, 8, dx+cw, dy, cw, 8);
                }
                dx += this._pattern_volu_width + this._pattern_spacing;

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
    if (state.cursor.get("row") !== this.shown_row || state.cursor.get("pattern") !== this.pat_canvas_patnum) {
      if (state.cursor.get("pattern") !== this.pat_canvas_patnum) {
        var p = song.song.patterns[state.cursor.get("pattern")];
        if (p) {
          this.renderPattern(state.cursor.get("pattern"));
          this.pat_canvas_patnum = state.cursor.get("pattern");
        }
      }

      var gfx = document.getElementById("gfxpattern");
      var ctx = gfx.getContext('2d');

      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, gfx.width, gfx.height);
      ctx.fillStyle = '#2a5684';
      ctx.fillRect(0, gfx.height/2 - (this._pattern_row_height/2), gfx.width, this._pattern_row_height);
      ctx.globalCompositeOperation = 'lighten';
      ctx.drawImage(this.pat_canvas, 0, gfx.height / 2 - (this._pattern_row_height/2) - this._pattern_row_height*(state.cursor.get("row")));
      ctx.globalCompositeOperation = 'source-over';
      this.shown_row = state.cursor.get("row");
    }
  }

  onScroll(e) {
    if (Math.abs(e.originalEvent.deltaY) > Math.abs(e.originalEvent.deltaX)) {
      this.yoff += e.originalEvent.deltaY;
      /*if (this.yoff < 0) {
        this.yoff = (this.events.scrollHeight - this.events.clientHeight) - 8;
      } else if (this.yoff >= ((this.events.scrollHeight - this.events.clientHeight) - 8)) {
        this.yoff = 0;
      }*/
      var row = Math.floor((this.yoff) / 15.0);
      row = (row % song.song.patterns[state.cursor.get('pattern')].numrows);
      state.set({
        cursor: {
          row
        }
      });
    } else {
      this.xscroll.scrollLeft += e.originalEvent.deltaX;
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

  updateCursor(timestamp) {
  }

  onCursorChanged(state) {
    window.requestAnimationFrame(this.render.bind(this));
  }

  onEventChanged(cursor) {
  }
}

