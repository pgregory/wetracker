import fontimage from '../../static/ft2font.png';

export default class XMView {
  constructor(player) {
    this.player = player;

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

    // pixel widths of each character in the proportional font
    this._fontwidths = [
      4, 7, 3, 6, 6, 6, 6, 5, 4, 5, 5, 5, 5, 5, 7, 7,
      5, 5, 5, 6, 6, 6, 6, 6, 6, 7, 6, 7, 7, 7, 7, 7,
      4, 2, 5, 7, 7, 7, 7, 3, 4, 4, 6, 6, 3, 6, 2, 7,
      6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 2, 3, 6, 6, 6, 7,
      7, 7, 7, 7, 7, 7, 7, 7, 7, 2, 7, 7, 7, 8, 8, 7,
      7, 7, 7, 7, 8, 7, 7, 8, 8, 8, 7, 4, 7, 4, 4, 5,
      3, 6, 6, 6, 6, 6, 4, 6, 6, 2, 4, 6, 2, 8, 6, 6,
      6, 6, 4, 6, 4, 6, 7, 8, 7, 6, 6, 4, 2, 4, 4, 4];

    this._bigfontwidths = [
       4, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 15,
      15, 15, 15, 15, 15, 15, 15, 15, 13, 13, 13, 15, 15, 15, 15, 15,
       4,  5, 12, 16, 15, 15, 16,  5,  8,  8, 13, 10,  6, 10,  5, 12,
      15, 15, 15, 15, 15, 15, 15, 15, 15, 15,  5,  6, 12, 10, 12, 15,
      14, 15, 15, 15, 15, 15, 15, 15, 15,  5, 13, 15, 14, 15, 15, 15,
      15, 16, 15, 15, 15, 15, 15, 15, 15, 15, 16,  7, 12,  7, 13, 15,
       5, 13, 13, 13, 13, 13, 11, 13, 13,  5,  9, 13,  5, 16, 13, 13,
      13, 13, 12, 13, 11, 13, 13, 16, 15, 13, 15,  9,  2,  9, 15, 15];

    // var title = document.getElementById("title");
    // make title element fit text exactly, then render it
    // title.width = this.getTextSize(this.player.xm.songname, this._bigfontwidths);
    // var ctx = title.getContext('2d');
    // this.drawBigText(this.player.xm.songname, 0, 1, ctx);

    var instrlist = document.getElementById("instruments");
    // clear instrument list if not already clear
    while (instrlist.childNodes.length) {
      instrlist.removeChild(instrlist.childNodes[0]);
    }
    var instrcols = ((this.player.xm.instruments.length + 7) / 8) | 0;
    for (var i = 0; i < instrcols; i++) {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      var instrcolumnwidth = 8*22;
      canvas.width = instrcolumnwidth;
      canvas.height = 8 * 10;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      var hasname = 0, hasdata = 0;
      for (var j = 8*i; j < Math.min(8*i+8, this.player.xm.instruments.length); j++) {
        var y = 10*(j - 8*i);
        var n = (j+1).toString(16);
        if (j < 15) n = '0' + n;
        var data = this.player.xm.instruments[j].samples;
        if (data) {
          var len = data[0].len;
          data = data[0].sampledata;
          var scale = Math.ceil(len / instrcolumnwidth);
          ctx.strokeStyle = '#55acff';
          ctx.beginPath();
          for (var k = 0; k < Math.min(len / scale, instrcolumnwidth - 20); k++) {
            ctx.lineTo(k + 20, y + data[k*scale] * 4 + 4);
          }
          ctx.stroke();
          hasdata++;
        }
        var name = this.player.xm.instruments[j].name;
        ctx.globalCompositeOperation = 'lighten';
        this.drawText(n, 1, y, ctx);
        if (name !== '') {
          this.drawText(this.player.xm.instruments[j].name, 20, y, ctx);
          hasname++;
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      if (hasname || hasdata) {
        instrlist.appendChild(canvas);
      }
    }

    var gfxpattern = document.getElementById("gfxpattern");
    gfxpattern.width = this._pattern_cellwidth * this.player.xm.nchan + this._pattern_border;

    // generate a fake audio event to render the initial paused screen
    var scopes = [];
    for (i = 0; i < this.player.xm.nchan; i++) {
      scopes.push(new Float32Array(this._scope_width));
    }

    // reset display
    this.shown_row = undefined;
    this.pat_canvas_patnum = undefined;

    this.audio_events = [];
    this.paused_events = [];
    this.audio_events.push({
      t: 0, row: 0, pat: this.player.xm.songpats[0],
      vu: new Float32Array(this.player.xm.nchan),
      scopes: scopes
    });
    this.redrawScreen();
  }

  imageLoaded() {
    this.fontloaded = true;
  };

  // draw FT2 proportional font text to a drawing context
  // returns width rendered
  drawText(text, dx, dy, ctx) {
    var dx0 = dx;
    for (var i = 0; i < text.length; i++) {
      var n = text.charCodeAt(i);
      var sx = (n&63)*8;
      var sy = (n>>6)*10 + 56;
      var width = this._fontwidths[n];
      ctx.drawImage(this.fontimg, sx, sy, width, 10, dx, dy, width, 10);
      dx += width + 1;
    }
    return dx - dx0;
  }

  getTextSize(text, widthtable) {
    var width = 0;
    for (var i = 0; i < text.length; i++) {
      var n = text.charCodeAt(i);
      width += widthtable[n] + 1;
    }
    return width;
  }

  drawBigText(text, dx, dy, ctx) {
    var dx0 = dx;
    for (var i = 0; i < text.length; i++) {
      var n = text.charCodeAt(i);
      var sx = (n&31)*16;
      var sy = (n>>5)*20 + 96;
      var width = this._bigfontwidths[n];
      ctx.drawImage(this.fontimg, sx, sy, width, 20, dx, dy, width, 20);
      dx += width + 1;
    }
    return dx - dx0;
  }


  RenderPattern(canv, pattern) {
    var cw = this._pattern_character_width;
    var rh = this._pattern_row_height;
    // a pattern consists of NxM cells which look like
    // N-O II VV EFF
    var cellwidth = this._pattern_cellwidth;
    canv.width = pattern[0].length * cellwidth + this._pattern_border;
    canv.height = pattern.length * rh;
    var ctx = canv.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.fillcolor='#000';
    ctx.fillRect(0, 0, canv.width, canv.height);
    for (var j = 0; j < pattern.length; j++) {
      var row = pattern[j];
      var dy = j * rh + ((rh - 8)/2);
      // render row number
      ctx.drawImage(this.fontimg, 8*(j>>4), 0, 8, 8, 2, dy, 8, 8);
      ctx.drawImage(this.fontimg, 8*(j&15), 0, 8, 8, 10, dy, 8, 8);

      for (var i = 0; i < row.length; i++) {
        var dx = i*cellwidth + 2 + this._pattern_border;
        var data = row[i];

        // render note
        var note = data[0];
        if (note < 0) {
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
        var inst = data[1];
        if (inst != -1) {  // no instrument = render nothing
          ctx.drawImage(this.fontimg, 8*(inst>>4), 0, 8, 8, dx, dy, 8, 8);
          ctx.drawImage(this.fontimg, 8*(inst&15), 0, 8, 8, dx+cw, dy, 8, 8);
        }
        dx += this._pattern_inst_width + this._pattern_spacing;

        // render volume
        var vol = data[2];
        if (vol < 0x10) {
          // no volume = ..
          ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx, dy, cw, 8);
          ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx+cw, dy, cw, 8);
        } else {
          ctx.drawImage(this.fontimg, 8*(vol>>4), 0, 8, 8, dx, dy, cw, 8);
          ctx.drawImage(this.fontimg, 8*(vol&15), 0, 8, 8, dx+cw, dy, cw, 8);
        }
        dx += this._pattern_volu_width + this._pattern_spacing;

        // render effect
        var eff = data[3];
        var effdata = data[4];
        if (eff !== 0 || effdata !== 0) {
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
  }

  redrawScreen() {
    if(!this.fontloaded) {
      window.requestAnimationFrame(() => this.redrawScreen() );
      return;
    }
    var e;
    var t = this.player.audioctx.currentTime;
    while (this.audio_events.length > 0 && this.audio_events[0].t < t) {
      e = this.audio_events.shift();
    }
    if (!e) {
      if (this.player.playing) {
        window.requestAnimationFrame(() => this.redrawScreen() );
      }
      return;
    }
    var VU = e.vu;
    var scopes = e.scopes;
    var ctx;

    if (e.scopes !== undefined) {
      // update VU meters & oscilliscopes
      for (var j = 0; j < this.player.xm.nchan; j++) {
        var canvas = document.getElementById(`vu${j}`);
        ctx = canvas.getContext("2d");
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0f0';
        ctx.strokeStyle = '#55acff';

        var x = 0; //this._pattern_border; // + j * this._pattern_cellwidth;
        // render channel number
        //this.drawText(''+j, x, 1, ctx);

        // volume in dB as a green bar
        var vu_y = -Math.log(VU[j])*10;
        ctx.fillRect(x, vu_y, 2, canvas.height-vu_y);

        var scale = canvas.width/this._scope_width;

        // oscilloscope
        var scope = scopes[j];
        if (scope) {
          ctx.beginPath();
          for (var k = 0; k < this._scope_width; k++) {
            ctx.lineTo((x + 1 + k)*scale, (canvas.height/2) - 16 * scope[k]);
          }
          ctx.stroke();
        }
      }
    }

    if (e.row != this.shown_row || e.pat != this.pat_canvas_patnum) {
      if (e.pat != this.pat_canvas_patnum) {
        var p = this.player.xm.patterns[e.pat];
        if (p) {
          this.RenderPattern(this.pat_canvas, this.player.xm.patterns[e.pat]);
          this.pat_canvas_patnum = e.pat;
        }
      }

      var gfx = document.getElementById("gfxpattern");
      ctx = gfx.getContext('2d');

      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, gfx.width, gfx.height);
      ctx.fillStyle = '#2a5684';
      ctx.fillRect(0, gfx.height/2 - (this._pattern_row_height/2), gfx.width, this._pattern_row_height);
      ctx.globalCompositeOperation = 'lighten';
      ctx.drawImage(this.pat_canvas, 0, gfx.height / 2 - (this._pattern_row_height/2) - this._pattern_row_height*(e.row));
      ctx.globalCompositeOperation = 'source-over';
      this.shown_row = e.row;
    }

    if (this.player.playing) {
      window.requestAnimationFrame(() => this.redrawScreen() );
    }
  }

  pushEvent(player, e) {
    this.audio_events.push(e);
    if (this.audio_events.length == 1) {
      window.requestAnimationFrame(() => this.redrawScreen());
    }
  }

  pause() {
    // grab all the audio events
    var t = this.player.audioctx.currentTime;
    while (this.audio_events.length > 0) {
      var e = this.audio_events.shift();
      e.t -= t;
      this.paused_events.push(e);
    }
  }

  resume() {
    var t = this.player.audioctx.currentTime;
    while (this.paused_events.length > 0) {
      var e = this.paused_events.shift();
      e.t += t;
      this.audio_events.push(e);
    }
    window.requestAnimationFrame(() => this.redrawScreen());
  }

  stop() {
    this.audio_events = [];
    this.paused_events = [];
  }
}
