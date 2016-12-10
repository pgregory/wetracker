import $ from 'jquery';

import styles from './styles.css';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import fontimage from '../../../static/ft2font-single.png';

import patternEditorTemplate from './templates/patterneditor.marko';

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

/* Generate tinted versions of the base bitmap font
 * Code from http://www.playmycode.com/blog/2011/06/realtime-image-tinting-on-html5-canvas/
 */
function generateRGBKs( img ) {
  var w = img.width;
  var h = img.height;
  var rgbks = [];

  var canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  var ctx = canvas.getContext("2d");
  ctx.drawImage( img, 0, 0 );

  var pixels = ctx.getImageData( 0, 0, w, h ).data;

  // 4 is used to ask for 3 images: red, green, blue and
  // black in that order.
  for ( var rgbI = 0; rgbI < 4; rgbI++ ) {
    var canvas = document.createElement("canvas");
    canvas.width  = w;
    canvas.height = h;

    var ctx = canvas.getContext('2d');
    ctx.drawImage( img, 0, 0 );
    var to = ctx.getImageData( 0, 0, w, h );
    var toData = to.data;

    for (
      var i = 0, len = pixels.length;
        i < len;
      i += 4
    ) {
      toData[i  ] = (rgbI === 0) ? pixels[i  ] : 0;
      toData[i+1] = (rgbI === 1) ? pixels[i+1] : 0;
      toData[i+2] = (rgbI === 2) ? pixels[i+2] : 0;
      toData[i+3] =                pixels[i+3]    ;
    }

    ctx.putImageData( to, 0, 0 );

    // image is _slightly_ faster then canvas for this, so convert
    var imgComp = new Image();
    imgComp.src = canvas.toDataURL();

    rgbks.push( imgComp );
  }

  return rgbks;
}

function generateTintImage( img, rgbks, red, green, blue ) {
  var buff = document.createElement( "canvas" );
  buff.width  = img.width;
  buff.height = img.height;

  var ctx  = buff.getContext("2d");

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'copy';
  ctx.drawImage( rgbks[3], 0, 0 );

  ctx.globalCompositeOperation = 'lighter';
  if ( red > 0 ) {
    ctx.globalAlpha = red   / 255.0;
    ctx.drawImage( rgbks[0], 0, 0 );
  }
  if ( green > 0 ) {
    ctx.globalAlpha = green / 255.0;
    ctx.drawImage( rgbks[1], 0, 0 );
  }
  if ( blue > 0 ) {
    ctx.globalAlpha = blue  / 255.0;
    ctx.drawImage( rgbks[2], 0, 0 );
  }

  return buff;
}

export default class PatternEditorCanvas {
  constructor(target) {
    this.yoff = 0;
    this.lastCursor = state.cursor;

    this.target = target;

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
    this._pattern_effe_width = (this._pattern_character_width * 3);
    this._cursor_offsets = [
      0,                                                      // Note
      this._pattern_note_width + this._element_spacing,       // Instr1
      this._pattern_character_width,                          // Instr2
      this._pattern_character_width + this._element_spacing,  // Vol1
      this._pattern_character_width,                          // Vol2
      this._pattern_character_width + this._element_spacing,  // FX Type
      this._pattern_character_width + 2,                      // FX Param1
      this._pattern_character_width,                          // FX Param2
    ];
    this._cursor_sizes = [
      this._pattern_note_width,                               // Note
      this._pattern_character_width,                          // Instr1
      this._pattern_character_width,                          // Instr2
      this._pattern_character_width,                          // Vol1
      this._pattern_character_width,                          // Vol2
      this._pattern_character_width,                          // FX Type
      this._pattern_character_width,                          // FX Param1
      this._pattern_character_width,                          // FX Param2
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

    this.xoffset;

    // canvas to render patterns onto
    this.pat_canvas = document.createElement('canvas');

    this.empty_event_canvas = document.createElement('canvas');
    this.empty_event_canvas.height = this._pattern_row_height;
    this.empty_event_canvas.width = this._pattern_cellwidth;

    this.timeline_canvas = document.createElement('canvas');
    this.timeline_canvas.height = this._pattern_row_height * 99;
    this.timeline_canvas.width = 30;


    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
    Signal.connect(song, "eventChanged", this, "onEventChanged");
    Signal.connect(song, "songChanged", this, "onSongChanged");
  }

  initWidth() {
    this.canvas.width = this.timeline_canvas.width + this._timeline_right_margin + (this._pattern_cellwidth * song.song.tracks.length);
  }

  imageLoaded() {
    this.fontloaded = true;

    // Generate tinted version
    var rgbks = generateRGBKs( this.fontimg );
    var noteFont = generateTintImage( this.fontimg, rgbks, 255, 255, 255 );
    var instrumentFont = generateTintImage( this.fontimg, rgbks, 255, 102, 102 );
    var volumeFont = generateTintImage( this.fontimg, rgbks, 102, 102, 102 );
    var panningFont = generateTintImage( this.fontimg, rgbks, 153, 102, 153 );
    var delayFont = generateTintImage( this.fontimg, rgbks, 153, 153, 102 );
    var fxFont = generateTintImage( this.fontimg, rgbks, 200, 200, 0 );

    this.noteFontOffset = this.fontimg.height;
    this.instrumentFontOffset = this.fontimg.height * 2;
    this.volumeFontOffset = this.fontimg.height * 3;
    this.panningFontOffset = this.fontimg.height * 4;
    this.delayFontOffset = this.fontimg.height * 5 ;
    this.fxFontOffset = this.fontimg.height * 6;

    this.mixedFont = document.createElement( "canvas" );
    this.mixedFont.width = this.fontimg.width;
    this.mixedFont.height = this.fontimg.height * 7;
    var ctx = this.mixedFont.getContext('2d');
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage( this.fontimg, 0, 0 );
    ctx.drawImage( noteFont, 0, this.noteFontOffset );
    ctx.drawImage( instrumentFont, 0, this.instrumentFontOffset );
    ctx.drawImage( volumeFont, 0, this.volumeFontOffset );
    ctx.drawImage( panningFont, 0, this.panningFontOffset );
    ctx.drawImage( delayFont, 0, this.delayFontOffset );
    ctx.drawImage( fxFont, 0, this.fxFontOffset );

    ctx = this.empty_event_canvas.getContext('2d');
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
    ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx+cw+2, 0, cw, 8);
    ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx+cw+2+cw, 0, cw, 8);

    ctx = this.timeline_canvas.getContext('2d');
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
    var cx = ((cursor.track + cursor.column) * this._pattern_cellwidth);
    var cy = cursor.row * this._pattern_row_height;
    return {
      cx,
      cy,
    };
  }

  renderEvent(ctx, col, dx, dy) {
    var cw = this._pattern_character_width;
    var rh = this._pattern_row_height;
    if ((col.note == null || col.note === -1) &&
        (col.instrument == null || col.instrument === -1) &&
        (col.volume == null || col.volume < 0x10) &&
        (col.fxtype == null || col.fxtype === -1) &&
        (col.fxparam == null)) {
      ctx.drawImage(this.empty_event_canvas, dx, dy);
    } else {
      // render note
      var note = col.note;
      if (note == null || note === -1) {
        // no note = ...
        ctx.drawImage(this.mixedFont, 8*39, 0, 8, 8, dx, dy, this._pattern_note_width, 8);
      } else {
        var notechars = this._note_names[note%12];
        var octavechar = ~~(note/12) * 8;
        ctx.drawImage(this.mixedFont, notechars[0], this.noteFontOffset, 8, 8, dx, dy, 8, 8);
        ctx.drawImage(this.mixedFont, notechars[1], this.noteFontOffset, 8, 8, dx + cw, dy, 8, 8);
        ctx.drawImage(this.mixedFont, octavechar, this.noteFontOffset, 8, 8, dx + (cw*2), dy, 8, 8);
      }
      dx += this._pattern_note_width + this._element_spacing;

      // render instrument
      var inst = col.instrument;
      if (inst && inst != -1) {  // no instrument = render nothing
        ctx.drawImage(this.mixedFont, 8*(inst>>4), this.instrumentFontOffset, 8, 8, dx, dy, 8, 8);
        ctx.drawImage(this.mixedFont, 8*(inst&15), this.instrumentFontOffset, 8, 8, dx+cw, dy, 8, 8);
      }
      dx += this._pattern_inst_width + this._element_spacing;

      // render volume
      var vol = col.volume;
      if (vol == null || vol < 0x10) {
        // no volume = ..
        ctx.drawImage(this.mixedFont, 312, 0, 8, 8, dx, dy, cw, 8);
        ctx.drawImage(this.mixedFont, 312, 0, 8, 8, dx+cw, dy, cw, 8);
      } else {
        ctx.drawImage(this.mixedFont, 8*(vol>>4), this.volumeFontOffset, 8, 8, dx, dy, cw, 8);
        ctx.drawImage(this.mixedFont, 8*(vol&15), this.volumeFontOffset, 8, 8, dx+cw, dy, cw, 8);
      }
      dx += this._pattern_volu_width + this._element_spacing;

      // render effect
      var eff = col.fxtype;
      var effdata = col.fxparam;
      if ((eff != null && eff !== -1)) {
        // draw effect with tiny font (4px space + effect type 0..9a..z)
        ctx.drawImage(this.mixedFont, 8*eff, this.fxFontOffset, 8, 8, dx, dy, cw, 8);
        dx += cw+2;
        // (hexadecimal 4-width font)
        ctx.drawImage(this.mixedFont, 8*(effdata>>4), this.fxFontOffset, 8, 8, dx, dy, cw, 8);
        ctx.drawImage(this.mixedFont, 8*(effdata&15), this.fxFontOffset, 8, 8, dx+cw, dy, cw, 8);
      } else {
        // no effect = ...
        ctx.drawImage(this.mixedFont, 312, 0, 8, 8, dx, dy, cw, 8);
        ctx.drawImage(this.mixedFont, 312, 0, 8, 8, dx+cw+2, dy, cw, 8);
        ctx.drawImage(this.mixedFont, 312, 0, 8, 8, dx+cw+2+cw, dy, cw, 8);
      }
    }
  }


  clearEvent(ctx, dx, dy) {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = "#000";
    ctx.clearRect(dx, dy, this._pattern_cellwidth, this._pattern_row_height);
  }

  renderPattern(pattern) {
    var cw = this._pattern_character_width;
    var rh = this._pattern_row_height;

    // a pattern consists of NxM cells which look like
    // N-O II VV EFF
    var cellwidth = this._pattern_cellwidth;
    var ctx = this.pat_canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle='#000';
    ctx.fillRect(0, 0, this.pat_canvas.width, this.pat_canvas.height);

    this.pat_canvas.width = song.song.tracks.length * cellwidth;
    this.pat_canvas.height = pattern.numrows * rh;

    for (var j = 0; j < pattern.rows.length; j++) {
      var row = pattern.rows[j];
      var dy = j * rh + ((rh - 8)/2);
      var trackColumn = 0;

      for (var tracki = 0; tracki < song.song.tracks.length; tracki += 1) {
        var track = row[tracki];
        var trackinfo = song.song.tracks[tracki];
        if(track) {
          for (var coli = 0; coli < track.notedata.length; coli += 1) {
            var col = track.notedata[coli];
            var dx = ((trackColumn + coli) * cellwidth) + this._event_left_margin;
            this.renderEvent(ctx, col, dx, dy);
          }
        } else {
          for (var coli = 0; coli < trackinfo.columns.length; coli += 1) {
            var dx = ((trackColumn + coli) * cellwidth) + this._event_left_margin;
            this.renderEvent(ctx, {}, dx, dy);
          }
        }
        trackColumn += trackinfo.columns.length;
      }
    }
    // Fill in empty rows
    for (; j < pattern.numrows; j++) {
      var dy = j * rh + ((rh - 8)/2);
      var trackColumn = 0;

      for (var tracki = 0; tracki < song.song.tracks.length; tracki += 1) {
        for (var coli = 0; coli < trackinfo.columns.length; coli += 1) {
          var dx = ((trackColumn + coli) * cellwidth) + this._event_left_margin;
          this.renderEvent(ctx, {}, dx, dy);
        }
        trackColumn += trackinfo.columns.length;
      }
    }
    // Render beat rows in a separate loop to avoid thrashing state changes
    ctx.globalCompositeOperation = 'lighten';
    for (var j = 0; j < pattern.numrows; j++) {
      var dy = j * rh;
      if (j % song.song.lpb == 0) {
        // Render a beat marker
        ctx.fillStyle = '#333';
        ctx.fillRect(0, dy, this.pat_canvas.width, this._pattern_row_height);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  renderEventBeat(ctx, cursor, cx, cy) {
    ctx.globalCompositeOperation = 'lighten';
    if (cursor.row % song.song.lpb == 0) {
      // Render a beat marker
      ctx.fillStyle = '#333';
      ctx.fillRect(cx, cy, this._pattern_cellwidth, this._pattern_row_height);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  stressPatternRender(count) {
    for(var i = 0; i < count; i +=1 ) {
      this.renderPattern(song.song.patterns[song.song.sequence[state.cursor.get("sequence")].pattern]);
      console.log(i);
    }
  }

  render() {
    $(this.target).append(patternEditorTemplate.renderToString());
    this.canvas = $(this.target).find('canvas')[0];

    this.initWidth();
    this.hscroll = $(this.canvas).closest('.hscroll');
    $(this.canvas).on('mousewheel', this.onScroll.bind(this));

    this.updateCanvas();
  }

  updateCanvas() {
    if(!this.fontloaded) {
      window.requestAnimationFrame(() => this.updateCanvas() );
      return;
    }
    if (state.cursor.get("row") !== this.lastCursor.row || 
        state.cursor.get("sequence") !== this.lastCursor.sequence ||
        state.cursor.get("track") !== this.lastCursor.track ||
        state.cursor.get("column") !== this.lastCursor.column ||
        state.cursor.get("item") !== this.lastCursor.item ||
        state.cursor.get("pattern") !== this.lastCursor.pattern ||
        this.hscroll.scrollLeft() !== this.xoffset) {
      if (state.cursor.get("pattern") !== this.lastCursor.pattern) {
        var p = song.song.patterns[state.cursor.get("pattern")];
        if (p) {
          this.renderPattern(p);
        }
      }

      this.redrawCanvas();

      this.lastCursor = state.cursor.toJS();
      this.xoffset = this.hscroll.scrollLeft();
    }
  }

  redrawCanvas() {
    if(!this.fontloaded) {
      window.requestAnimationFrame(() => this.redrawCanvas() );
      return;
    }
    var ctx = this.canvas.getContext('2d');

    var h = $("#pattern-editor").height();
    h = Math.floor((h-11)/this._pattern_row_height);
    if(h%2 === 0) h -= 1;
    h *= this._pattern_row_height;
    this.canvas.height = h;

    var patternheight = this.canvas.height - this._pattern_header_height;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.pat_canvas, this.timeline_canvas.width + this._timeline_right_margin, this.canvas.height / 2 - (this._pattern_row_height/2) - this._pattern_row_height*(state.cursor.get("row")));
    ctx.fillStyle = '#000';
    ctx.clearRect(0, 0, this.canvas.width, this._pattern_header_height);
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
    ctx.lineTo(this.canvas.width, 0);
    ctx.lineTo(this.canvas.width, this.canvas.height);
    ctx.lineTo(this.timeline_canvas.width + 1, this.canvas.height);
    //ctx.lineTo(this.timeline_canvas.width + this._timeline_right_margin, 0);
    for(var i = 1; i < song.song.tracks.length; i += 1) {
      var dx = this.timeline_canvas.width + this._timeline_right_margin + (i * this._pattern_cellwidth);
      ctx.moveTo(dx, 0);
      ctx.lineTo(dx, this.canvas.height);
    }
    ctx.moveTo(this.hscroll.scrollLeft() + this.timeline_canvas.width + 1, 0);
    ctx.lineTo(this.hscroll.scrollLeft() + this.timeline_canvas.width + 1, this.canvas.height);
    ctx.stroke();

    // Draw the timline fixed to the left of the view.
    var tlw = this.timeline_canvas.width;
    var tlh = this._pattern_row_height * song.song.patterns[state.cursor.get("pattern")].numrows;
    ctx.fillStyle = '#000';
    ctx.fillRect(this.hscroll.scrollLeft(),0, this.timeline_canvas.width, this.canvas.height);
    ctx.drawImage(this.timeline_canvas, 0, 0, tlw, tlh, this.hscroll.scrollLeft(), this.canvas.height / 2 - (this._pattern_row_height/2) - this._pattern_row_height*(state.cursor.get("row")), tlw, tlh);
    ctx.fillRect(this.hscroll.scrollLeft(),0, this.timeline_canvas.width, this._pattern_header_height);

    // Draw the cursor row.
    var cy = this.canvas.height/2 - (this._pattern_row_height/2);
    ctx.globalCompositeOperation = 'lighten';
    ctx.fillStyle = '#2a5684';
    ctx.fillRect(0, cy, this.canvas.width, this._pattern_row_height);

    // Draw the individual cursor
    ctx.fillStyle = '#0F0';
    ctx.globalCompositeOperation = 'darken';
    var cx = this.timeline_canvas.width + this._timeline_right_margin + this._event_left_margin;
    cx += state.cursor.get("track") * this._pattern_cellwidth;
    for(var i = 1; i <= state.cursor.get("item"); i += 1) {
      cx += this._cursor_offsets[i];
    }
    ctx.fillRect(cx, cy, this._cursor_sizes[state.cursor.get("item")], this._pattern_row_height);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#0F0';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx-1, cy-1, this._cursor_sizes[state.cursor.get("item")]+2, this._pattern_row_height+2);
  }

  refresh() {
    $(this.target).empty();
    this.render();
    window.requestAnimationFrame(() => this.redrawCanvas());
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
      this.updateCanvas();
    }
    e.preventDefault();
  }

  /* eslint no-param-reassign: ["error", { "props": false }]*/
  scrollHorizTo(element, to, duration) {
    const start = element.scrollLeft();
    const change = to - start;
    let currentTime = 0;
    const increment = 20;

    function animateScroll() {
      currentTime += increment;
      element.scrollLeft(easeInOutQuad(currentTime, start, change, duration));
      this.updateCanvas();
      if (currentTime < duration) {
        setTimeout(animateScroll.bind(this), increment);
      }
    }
    animateScroll.bind(this)();
  }

  onCursorChanged(state) {
    /* If the cursor has moved to a different track, column or item,
     * check if it's still visible and scroll into view if not.
     */
    if ((this.lastCursor.item !== state.cursor.get("item")) ||
        (this.lastCursor.track !== state.cursor.get("track")) ||
        (this.lastCursor.column !== state.cursor.get("column"))) {
      var pos = this.eventPositionInPatternCanvas(state.cursor.toJS());
      var maxpos = this.hscroll.width() - this.timeline_canvas.width + this._timeline_right_margin;
      var minpos = this.timeline_canvas.width + this._timeline_right_margin;
      if(((pos.cx + this._pattern_cellwidth) - this.hscroll.scrollLeft()) > maxpos) {
       this.scrollHorizTo(this.hscroll, ((pos.cx + this._pattern_cellwidth) - maxpos) + 8, 100); 
      } else if((pos.cx - this.hscroll.scrollLeft()) < minpos) {
        this.scrollHorizTo(this.hscroll, pos.cx - 6, 100);
      }
    }
    window.requestAnimationFrame(this.updateCanvas.bind(this));
  }

  onEventChanged(cursor, event) {
    var pos = this.eventPositionInPatternCanvas(cursor);
    var ctx = this.pat_canvas.getContext('2d');
    this.clearEvent(ctx, pos.cx, pos.cy);
    this.renderEvent(ctx, event, pos.cx + this._event_left_margin, pos.cy + (this._pattern_row_height - 8)/2);
    this.renderEventBeat(ctx, cursor, pos.cx, pos.cy);
    this.redrawCanvas();
  }

  onSongChanged() {
    this.lastCursor = {};
    // Reset the pattern editor for the new song.
    var pattern = undefined;
    try {
      pattern = song.song.sequence[0].pattern;
    } catch(e) {
      // It's ok, just leave it undefined for now.
      pattern = undefined;
    }
    this.initWidth();
    state.set({
      cursor: {
        pattern,
        row: 0,
        track: 0,
        column: 0,
        item: 0,
      }
    });
  }
}

