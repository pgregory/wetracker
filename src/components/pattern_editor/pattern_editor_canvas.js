import $ from 'jquery';
import Immutable from 'immutable';
import MouseTrap from 'mousetrap';

import '../../utils/inlineedit';

import './styles.css';

import { connect } from '../../utils/signal';

import { state } from '../../state';
import { song } from '../../utils/songmanager';
import { player, MUTE, SILENT } from '../../audio/player';

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
function generateRGBKs(img) {
  const w = img.width;
  const h = img.height;
  const rgbks = [];

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const pixels = ctx.getImageData(0, 0, w, h).data;

  // 4 is used to ask for 3 images: red, green, blue and
  // black in that order.
  for (let rgbI = 0; rgbI < 4; rgbI += 1) {
    const colCanvas = document.createElement('canvas');
    colCanvas.width = w;
    colCanvas.height = h;

    const colCtx = colCanvas.getContext('2d');
    colCtx.drawImage(img, 0, 0);
    const to = colCtx.getImageData(0, 0, w, h);
    const toData = to.data;

    for (let i = 0, len = pixels.length; i < len; i += 4) {
      toData[i] = (rgbI === 0) ? pixels[i] : 0;
      toData[i + 1] = (rgbI === 1) ? pixels[i + 1] : 0;
      toData[i + 2] = (rgbI === 2) ? pixels[i + 2] : 0;
      toData[i + 3] = pixels[i + 3];
    }

    colCtx.putImageData(to, 0, 0);

    rgbks.push(colCanvas);
  }

  return rgbks;
}

function generateTintImage(img, rgbks, red, green, blue) {
  const buff = document.createElement('canvas');
  buff.width = img.width;
  buff.height = img.height;

  const ctx = buff.getContext('2d');

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'copy';
  ctx.drawImage(rgbks[3], 0, 0);

  ctx.globalCompositeOperation = 'lighter';
  if (red > 0) {
    ctx.globalAlpha = red / 255.0;
    ctx.drawImage(rgbks[0], 0, 0);
  }
  if (green > 0) {
    ctx.globalAlpha = green / 255.0;
    ctx.drawImage(rgbks[1], 0, 0);
  }
  if (blue > 0) {
    ctx.globalAlpha = blue / 255.0;
    ctx.drawImage(rgbks[2], 0, 0);
  }

  return buff;
}

export default class PatternEditorCanvas {
  constructor(target) {
    this.yoff = 0;
    this.lastCursor = new Immutable.Map();

    this.target = target;

    this.patternRowHeight = 12;
    this.patternCharacterWidth = 8;
    this.patternSpacing = 4;
    this.patternHeaderHeight = 50;
    this.timelineRightMargin = 0;
    this.eventLeftMargin = 4;
    this.eventRightMargin = 4;
    this.elementSpacing = 4;
    this.patternNoteWidth = this.patternCharacterWidth * 3;
    this.patternInstWidth = this.patternCharacterWidth * 2;
    this.patternVolumeWidth = this.patternCharacterWidth * 2;
    this.patternEffectWidth = (this.patternCharacterWidth * 3);
    this.cursorOffsets = [
      this.eventLeftMargin,                                // Note
      this.patternNoteWidth + this.elementSpacing,       // Instr1
      this.patternCharacterWidth,                          // Instr2
      this.patternCharacterWidth + this.elementSpacing,  // Vol1
      this.patternCharacterWidth,                          // Vol2
      this.patternCharacterWidth + this.elementSpacing,  // FX Type
      this.patternCharacterWidth + 2,                      // FX Param1
      this.patternCharacterWidth,                          // FX Param2
    ];
    this.cursorSizes = [
      this.patternNoteWidth,                               // Note
      this.patternCharacterWidth,                          // Instr1
      this.patternCharacterWidth,                          // Instr2
      this.patternCharacterWidth,                          // Vol1
      this.patternCharacterWidth,                          // Vol2
      this.patternCharacterWidth,                          // FX Type
      this.patternCharacterWidth,                          // FX Param1
      this.patternCharacterWidth,                          // FX Param2
    ];
    // N-O II VV EFF
    this.patternCellWidth = this.eventLeftMargin
                            + (this.patternNoteWidth + this.elementSpacing)
                            + (this.patternInstWidth + this.elementSpacing)
                            + (this.patternVolumeWidth + this.elementSpacing)
                            + (this.patternEffectWidth + this.elementSpacing)
                            + this.eventRightMargin;

    this.noteNames = [
      [96, 288], [96, 296], [104, 288], [104, 296], [112, 288], [120, 288],
      [120, 296], [128, 288], [128, 296], [80, 288], [80, 296], [88, 288],
    ];

    // Load font (ripped from FastTracker 2)
    this.fontloaded = false;
    this.onFontLoaded = [];
    this.fontimg = new window.Image();
    this.fontimg.onload = () => this.imageLoaded();
    this.fontimg.src = fontimage;

    this.emptyEventCanvas = document.createElement('canvas');
    this.emptyEventCanvas.height = this.patternRowHeight;
    this.emptyEventCanvas.width = this.patternCellWidth;

    this.emptyPatternCanvas = document.createElement('canvas');

    this.timelineCanvas = document.createElement('canvas');
    this.timelineCanvas.height = this.patternRowHeight * 256;
    this.timelineCanvas.width = 30;

    this.trackBorderColour = '#666';

    MouseTrap.bind('mod+c', (e) => {
      this.copyRegion();
      e.preventDefault();
    });

    MouseTrap.bind('mod+v', (e) => {
      this.pasteRegion();
      e.preventDefault();
    });

    MouseTrap.bind('alt+r', () => {
      this.redrawCanvas();
    });

    MouseTrap.bind('shift+p', () => {
      this.focus();
    });

    connect(state, 'cursorChanged', this, 'onCursorChanged');
    connect(state, 'transportChanged', this, 'onTransportChanged');
    connect(song, 'eventChanged', this, 'onEventChanged');
    connect(song, 'songChanged', this, 'onSongChanged');
    connect(song, 'patternChanged', this, 'onPatternChanged');
    connect(state, 'songChanged', this, 'onSongStateChanged');
    connect(player, 'trackStateChanged', this, 'onTrackStateChanged');
  }

  initWidth() {
    const numtracks = song.getNumTracks();
    let totalWidth = 0;
    for (let tracki = 0; tracki < numtracks; tracki += 1) {
      totalWidth += song.getTrackNumColumns(tracki) * this.patternCellWidth;
    }
    this.canvas.width = totalWidth;
    this.timelines.each((i, t) => {
      t.width = this.timelineCanvas.width + this.timelineRightMargin;
    });

    $(this.target).find('.track-names').width(this.canvas.width);
    $(this.target).find('.track-controls').width(this.canvas.width);
    $(this.target).find('.track-name').width(this.patternCellWidth);
    $(this.target).find('.track-control').outerWidth(this.patternCellWidth);
  }

  imageLoaded() {
    // Generate tinted version
    const rgbks = generateRGBKs(this.fontimg);
    const noteFont = generateTintImage(this.fontimg, rgbks, 255, 255, 255);
    const instrumentFont = generateTintImage(this.fontimg, rgbks, 255, 102, 102);
    const volumeFont = generateTintImage(this.fontimg, rgbks, 102, 255, 102);
    const panningFont = generateTintImage(this.fontimg, rgbks, 153, 102, 153);
    const delayFont = generateTintImage(this.fontimg, rgbks, 153, 153, 102);
    const fxFont = generateTintImage(this.fontimg, rgbks, 200, 200, 0);

    this.noteFontOffset = this.fontimg.height;
    this.instrumentFontOffset = this.fontimg.height * 2;
    this.volumeFontOffset = this.fontimg.height * 3;
    this.panningFontOffset = this.fontimg.height * 4;
    this.delayFontOffset = this.fontimg.height * 5;
    this.fxFontOffset = this.fontimg.height * 6;

    this.mixedFont = document.createElement('canvas');
    this.mixedFont.width = this.fontimg.width;
    this.mixedFont.height = this.fontimg.height * 7;
    let ctx = this.mixedFont.getContext('2d');
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.fontimg, 0, 0);
    ctx.drawImage(noteFont, 0, this.noteFontOffset);
    ctx.drawImage(instrumentFont, 0, this.instrumentFontOffset);
    ctx.drawImage(volumeFont, 0, this.volumeFontOffset);
    ctx.drawImage(panningFont, 0, this.panningFontOffset);
    ctx.drawImage(delayFont, 0, this.delayFontOffset);
    ctx.drawImage(fxFont, 0, this.fxFontOffset);

    ctx = this.emptyEventCanvas.getContext('2d');
    let dx = 0;
    const cw = this.patternCharacterWidth;
    const rh = this.patternRowHeight;

    this.renderEmptyPatternRow();

    // render note
    ctx.drawImage(this.fontimg, 8 * 39, 0, 8, 8, dx, 0, this.patternNoteWidth, 8);
    dx += this.patternNoteWidth + this.patternSpacing;
    dx += this.patternInstWidth + this.patternSpacing;
    // render volume
    ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx, 0, cw, 8);
    ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx + cw, 0, cw, 8);
    dx += this.patternVolumeWidth + this.patternSpacing;
    // render effect
    ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx, 0, cw, 8);
    ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx + cw + 2, 0, cw, 8);
    ctx.drawImage(this.fontimg, 312, 0, 8, 8, dx + cw + 2 + cw, 0, cw, 8);

    ctx = this.timelineCanvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.timelineCanvas.width, this.timelineCanvas.height);
    const offset = (this.timelineCanvas.width - 16) / 2.0;
    dx = 0;
    for (let j = 0; j < 256; j += 1) {
      const dy = (j * rh) + ((rh - 8) / 2);
      // render row number
      ctx.drawImage(this.fontimg, 8 * (j >> 4), 0, 8, 8, offset, dy, 8, 8); // eslint-disable-line no-bitwise
      ctx.drawImage(this.fontimg, 8 * (j & 15), 0, 8, 8, offset + 8, dy, 8, 8); // eslint-disable-line no-bitwise
    }

    this.fontloaded = true;
    while (this.onFontLoaded.length > 0) {
      (this.onFontLoaded.shift())();
    }
  }

  renderEmptyPatternRow() {
    let totalWidth = 0;
    const numTracks = song.getNumTracks();
    for (let tracki = 0; tracki < numTracks; tracki += 1) {
      totalWidth += this.patternCellWidth * song.getTrackNumColumns(tracki);
    }
    this.emptyPatternCanvas.height = this.patternRowHeight;
    this.emptyPatternCanvas.width = totalWidth;

    const ctx = this.emptyPatternCanvas.getContext('2d', { alpha: false });
    let x = this.eventLeftMargin;
    for (let t = 0; t < numTracks; t += 1) {
      for (let c = 0; c < song.getTrackNumColumns(t); c += 1) {
        ctx.drawImage(this.emptyEventCanvas, x, 0);
        x += this.patternCellWidth;
      }
    }
  }

  eventPositionInPatternCanvas(cursor) {
    let cx = 0;
    for (let t = 0; t < cursor.track; t += 1) {
      cx += this.patternCellWidth * song.getTrackNumColumns(t);
    }
    cx += this.patternCellWidth * cursor.column;
    const cy = cursor.row * this.patternRowHeight;
    return {
      cx,
      cy,
    };
  }

  renderEvent(ctx, col, dx, dy) {
    let ddx = dx;
    const cw = this.patternCharacterWidth;
    // render note
    const { note } = col;
    if (note != null && note !== -1) {
      if (note === 96) {
        ctx.fillStyle = '#000';
        ctx.fillRect(ddx, dy, this.patternNoteWidth, 8);
        ctx.strokeStyle = '#FFF';
        ctx.strokeRect(ddx + 1.5, dy + 1.5, this.patternNoteWidth - 3, 3);
      } else {
        const notechars = this.noteNames[note % 12];
        const octavechar = ~~(note / 12) * 8; // eslint-disable-line no-bitwise
        ctx.drawImage(this.mixedFont, notechars[0], this.noteFontOffset, 8, 8, ddx, dy, 8, 8);
        ctx.drawImage(this.mixedFont, notechars[1], this.noteFontOffset, 8, 8, ddx + cw, dy, 8, 8);
        ctx.drawImage(this.mixedFont, octavechar, this.noteFontOffset, 8, 8, ddx + (cw * 2), dy, 8, 8);
      }
    }
    ddx += this.patternNoteWidth + this.elementSpacing;

    // render instrument
    const inst = col.instrument;
    if (inst && inst !== -1) {  // no instrument = render nothing
      ctx.drawImage(this.mixedFont, 8 * (inst >> 4), this.instrumentFontOffset, 8, 8, ddx, dy, 8, 8); // eslint-disable-line no-bitwise
      ctx.drawImage(this.mixedFont, 8 * (inst & 15), this.instrumentFontOffset, 8, 8, ddx + cw, dy, 8, 8); // eslint-disable-line no-bitwise
    }
    ddx += this.patternInstWidth + this.elementSpacing;

    // render volume
    const vol = col.volume;
    if (vol != null && vol >= 0x10) {
      // Draw the volume effect type
      const voltype = vol >> 4; // eslint-disable-line no-bitwise
      if (voltype >= 1 && voltype <= 5) {
        ctx.drawImage(this.mixedFont, 8 * (voltype - 1), this.volumeFontOffset, 8, 8, ddx, dy, cw, 8);
      } else {
        ctx.drawImage(this.mixedFont, 368 + (8 * (voltype - 6)), this.volumeFontOffset, 8, 8, ddx, dy, cw, 8);
      }
      ctx.drawImage(this.mixedFont, 8 * (vol & 15), this.volumeFontOffset, 8, 8, ddx + cw, dy, cw, 8); // eslint-disable-line no-bitwise
    }
    ddx += this.patternVolumeWidth + this.elementSpacing;

    // render effect
    const eff = col.fxtype;
    const effdata = col.fxparam;
    if ((eff != null && eff !== -1) && (eff !== 0 || effdata !== 0)) {
      // draw effect with tiny font (4px space + effect type 0..9a..z)
      ctx.drawImage(this.mixedFont, 8 * eff, this.fxFontOffset, 8, 8, ddx, dy, cw, 8);
      ddx += cw + 2;
      // (hexadecimal 4-width font)
      ctx.drawImage(this.mixedFont, 8 * (effdata >> 4), this.fxFontOffset, 8, 8, ddx, dy, cw, 8); // eslint-disable-line no-bitwise
      ctx.drawImage(this.mixedFont, 8 * (effdata & 15), this.fxFontOffset, 8, 8, ddx + cw, dy, cw, 8); // eslint-disable-line no-bitwise
    }
  }

  clearEvent(ctx, dx, dy) {
    ctx.drawImage(this.emptyEventCanvas, dx + this.eventLeftMargin, dy + ((this.patternRowHeight - 8) / 2));
  }

  renderPatternToCanvas(patternCanvas, index, y) {
    const ctx = patternCanvas.getContext('2d');
    ctx.save();

    const numtracks = song.getNumTracks();
    const rh = this.patternRowHeight;
    const cellwidth = this.patternCellWidth;
    const numrows = song.getPatternRowCount(index);
    const rowData = state.song.getIn(['patterns', index, 'rows']);
    const columnData = state.song.getIn(['tracks']);

    if (rowData && columnData) {
      const rows = rowData.toJS();
      const columns = columnData.toJS();
      for (let j = 0; j < numrows; j += 1) {
        const dy = (j * rh) + ((rh - 8) / 2) + y;
        let trackColumn = 0;

        // Don't render rows that are out of range.
        if (dy > 0 && (dy + rh) < patternCanvas.height) {
          ctx.drawImage(this.emptyPatternCanvas, 0, dy);

          for (let tracki = 0; tracki < numtracks; tracki += 1) {
            if (columns[tracki]) {
              const numcolumns = columns[tracki].columns.length;
              if (rows[j] && rows[j][tracki]) {
                const track = rows[j][tracki];
                if (track && 'notedata' in track) {
                  for (let coli = 0; coli < numcolumns; coli += 1) {
                    if (coli < track.notedata.length && track.notedata[coli]) {
                      const dx = ((trackColumn + coli) * cellwidth) + this.eventLeftMargin;
                      this.renderEvent(ctx, track.notedata[coli], dx, dy);
                    }
                  }
                } else {
                  for (let coli = 0; coli < numcolumns; coli += 1) {
                    const dx = ((trackColumn + coli) * cellwidth);
                    this.clearEvent(ctx, dx, dy);
                  }
                }
              }
              trackColumn += numcolumns;
            }
          }
        }
      }
      // Render beat rows in a separate loop to avoid thrashing state changes
      ctx.globalCompositeOperation = 'lighten';
      ctx.fillStyle = '#333';
      for (let j = 0; j < numrows; j += 1) {
        const dy = j * rh + y;
        if (j % song.getSpeed() === 0) {
          // Render a beat marker
          ctx.fillRect(0, dy, patternCanvas.width, this.patternRowHeight);
        }
      }
      ctx.restore();
    }
    return patternCanvas;
  }

  renderEventBeat(ctx, cursor, cx, cy) {
    ctx.globalCompositeOperation = 'lighten';
    if (cursor.row % song.getSpeed() === 0) {
      // Render a beat marker
      ctx.fillStyle = '#333';
      ctx.fillRect(cx, cy, this.patternCellWidth, this.patternRowHeight);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  render() {
    $(this.target).addClass('pattern-editor');

    const pindex = state.cursor.get('pattern');
    const numrows = song.getPatternRowCount(pindex);
    $(this.target).append(patternEditorTemplate.renderToString({
      transport: state.transport.toJS(),
      tracknames: song.getTrackNames(),
      numrows,
    }));
    this.canvas = $(this.target).find('canvas#gfxpattern')[0]; // eslint-disable-line prefer-destructuring
    this.timelines = $(this.target).find('canvas.timelinecanvas');

    this.hscroll = $(this.canvas).closest('.hscroll');
    this.patterndata = $(this.canvas).closest('.patterndata');
    this.initWidth();
    $(this.patterndata).on('wheel', this.onScroll.bind(this));
    $(this.canvas).on('click', this.onClick.bind(this));

    $(this.target).find('input').bind('enterKey', (e) => {
      state.set({
        transport: {
          step: parseInt($(this.target).find('#step').val(), 10),
        },
      });
      song.setPatternLength(pindex, parseInt($(this.target).find('#length').val(), 10));
      $(e.target).blur();
    });
    $(this.target).find('input').keyup(function keyup(e) {
      if (e.keyCode === 13) {
        $(this).trigger('enterKey');
      }
    });

    $(this.target).find('.track-name div').inlineEdit({
      accept: function accept(val) {
        const trackindex = $(this).parents('.track-name').data('trackindex');
        song.setTrackName(trackindex, val);
      },
    });

    $(this.target).find('#add-track').click(() => {
      song.addTrack();
      this.refresh();
    });

    $(this.target).find('#remove-track').click(() => {
      song.removeTrack(song.getNumTracks() - 1);
      this.refresh();
    });

    $(this.target).find('.add-column').click((e) => {
      const track = $(e.target).parents('.track-control').data('trackindex');
      song.addColumnToTrack(track);
      this.renderEmptyPatternRow();
      // this.renderAllPatterns();
      this.refresh();
    });

    $(this.target).find('.remove-column').click((e) => {
      const track = $(e.target).parents('.track-control').data('trackindex');
      song.removeColumnFromTrack(track);
      this.renderEmptyPatternRow();
      // this.renderAllPatterns();
      this.refresh();
    });

    if (!this.fontloaded) {
      this.onFontLoaded.push(() => {
        // this.renderAllPatterns();
        this.redrawCanvas();
      });
    } else {
      // this.renderAllPatterns();
      this.redrawCanvas();
    }
  }

  normaliseSelectionCursors() {
    const cursor = state.cursor.toJS();

    const result = {};

    result.row_start = Math.min(cursor.row_end, cursor.row_start);
    result.row_end = Math.max(cursor.row_end, cursor.row_start);

    let item1 = 0;
    let col1 = 0;
    for (let t = 0; t < cursor.track_end; t += 1) {
      col1 += song.getTrackNumColumns(t);
      item1 += song.getTrackNumColumns(t) * 8;
    }
    col1 += cursor.column_end;
    item1 += cursor.item_end;

    let item2 = 0;
    let col2 = 0;
    for (let t = 0; t < cursor.track_start; t += 1) {
      col2 += song.getTrackNumColumns(t);
      item2 += song.getTrackNumColumns(t) * 8;
    }
    col2 += cursor.column_start;
    item2 += cursor.item_start;

    result.track_start = Math.min(cursor.track_end, cursor.track_start);
    result.track_end = Math.max(cursor.track_end, cursor.track_start);

    result.column_start = (col1 < col2) ? cursor.column_end : cursor.column_start;
    result.column_end = (col1 < col2) ? cursor.column_start : cursor.column_end;

    result.item_start = (item1 < item2) ? cursor.item_end : cursor.item_start;
    result.item_end = (item1 < item2) ? cursor.item_start : cursor.item_end;

    return result;
  }

  redrawCanvas() {
    const ctx = this.canvas.getContext('2d');
    const h = $(this.target).find('.patterndata')[0].clientHeight;

    this.canvas.height = h;
    for (let tl = 0, tle = this.timelines.length; tl < tle; tl += 1) {
      this.timelines[tl].height = h;
    }

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.globalCompositeOperation = 'source-over';
    const y = Math.round((this.canvas.height / 2) - (this.patternRowHeight / 2) - (this.patternRowHeight * (state.cursor.get('row'))));
    const sequence = state.cursor.get('sequence');
    const patternIndex = song.getSequencePatternNumber(sequence);
    this.renderPatternToCanvas(this.canvas, patternIndex, y);

    let nextInSequence = state.cursor.get('sequence') + 1;
    if (nextInSequence >= song.getSequenceLength()) {
      nextInSequence = 0;
    }
    let prevInSequence = state.cursor.get('sequence') - 1;
    if (prevInSequence < 0) {
      prevInSequence = song.getSequenceLength() - 1;
    }
    // Draw the timeline fixed to the left and right of the view.
    const tlh = this.patternRowHeight * song.getPatternRowCount(state.cursor.get('pattern'));
    for (let tl = 0, tle = this.timelines.length; tl < tle; tl += 1) {
      const tctx = this.timelines[tl].getContext('2d');
      const tlw = this.timelineCanvas.width;
      tctx.drawImage(this.timelineCanvas, 0, 0, tlw, tlh, 0, y, tlw, tlh);
      tctx.fillRect(0, 0, this.timelineCanvas.width, this.patternHeaderHeight);
    }

    // Draw the cursor row.
    const cy = Math.round((this.canvas.height / 2) - (this.patternRowHeight / 2));
    ctx.globalCompositeOperation = 'lighten';
    ctx.fillStyle = '#2a5684';
    ctx.fillRect(0, cy, this.canvas.width, this.patternRowHeight);

    // Fade any muted tracks.
    for (let tracki = 0; tracki < player.tracks.length; tracki += 1) {
      if ([SILENT, MUTE].indexOf(player.tracks[tracki].getState().state) !== -1) {
        // Draw a semi-transparent box over silent/muted tracks.
        ctx.globalCompositeOperation = 'darken';
        ctx.fillStyle = '#444';
        const dx = tracki * this.patternCellWidth;
        ctx.fillRect(dx, 0, this.patternCellWidth, this.canvas.height);
      }
    }

    // Draw the individual cursor
    ctx.fillStyle = '#0F0';
    ctx.globalCompositeOperation = 'darken';
    let cx = this.eventLeftMargin;
    let t = 0;
    while (t < state.cursor.get('track')) {
      for (let c = 0; c < song.getTrackNumColumns(t); c += 1) {
        cx += this.patternCellWidth;
      }
      t += 1;
    }
    let c = 0;
    while (c < state.cursor.get('column')) {
      cx += this.patternCellWidth;
      c += 1;
    }
    for (let i = 1; i <= state.cursor.get('item'); i += 1) {
      cx += this.cursorOffsets[i];
    }
    ctx.fillRect(cx, cy, this.cursorSizes[state.cursor.get('item')], this.patternRowHeight);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#0F0';
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - 1, cy - 1, this.cursorSizes[state.cursor.get('item')] + 2, this.patternRowHeight + 2);

    // Draw select region
    const rowStart = state.cursor.get('row_start');
    const rowEnd = state.cursor.get('row_end');
    const trackStart = state.cursor.get('track_start');
    const trackEnd = state.cursor.get('track_end');
    const columnStart = state.cursor.get('column_start');
    const columnEnd = state.cursor.get('column_end');
    const itemStart = state.cursor.get('item_start');
    const itemEnd = state.cursor.get('item_end');

    if (rowStart !== rowEnd || trackStart !== trackEnd || columnStart !== columnEnd || itemStart !== itemEnd) {
      ctx.save();

      const startCursorSY = y + Math.round(rowStart * this.patternRowHeight);
      let startCursorSX = this.eventLeftMargin;
      startCursorSX += trackStart * this.patternCellWidth;
      for (let i = 1; i <= itemStart; i += 1) {
        startCursorSX += this.cursorOffsets[i];
      }
      const startCursorEX = startCursorSX + this.cursorSizes[itemStart];
      const startCursorEY = startCursorSY + this.patternRowHeight;

      const endCursorSY = y + Math.round(rowEnd * this.patternRowHeight);
      let endCursorSX = this.eventLeftMargin;
      endCursorSX += trackEnd * this.patternCellWidth;
      for (let i = 1; i <= itemEnd; i += 1) {
        endCursorSX += this.cursorOffsets[i];
      }
      const endCursorEX = endCursorSX + this.cursorSizes[itemEnd];
      const endCursorEY = endCursorSY + this.patternRowHeight;

      const c1x = Math.min(startCursorSX, endCursorSX);
      const c1y = Math.min(startCursorSY, endCursorSY);
      const c2x = Math.max(startCursorEX, endCursorEX);
      const c2y = Math.max(startCursorEY, endCursorEY);

      ctx.fillStyle = '#0F0';
      ctx.strokeStyle = '#0F0';
      ctx.globalAlpha = 0.2;
      ctx.fillRect(c1x, c1y, c2x - c1x, c2y - c1y);
      ctx.globalAlpha = 1.0;
      ctx.strokeRect(c1x - 1, c1y - 1, (c2x - c1x) + 2, (c2y - c1y) + 2);
      ctx.restore();
    }
    ctx.clearRect(0, 0, this.canvas.width, this.patternHeaderHeight);

    /* Render the track grid */
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.trackBorderColour;
    ctx.beginPath();
    const numtracks = song.getNumTracks();
    let dx = 0;
    for (let i = 0; i <= numtracks; i += 1) {
      ctx.moveTo(dx, 0);
      ctx.lineTo(dx, this.canvas.height);
      const trackWidth = song.getTrackNumColumns(i) * this.patternCellWidth;
      // Resize the header div to match
      $(this.target).find(`.track-name[data-trackindex='${i}']`).width(trackWidth);
      $(this.target).find(`.track-control[data-trackindex='${i}']`).outerWidth(trackWidth);
      dx += trackWidth;
    }
    ctx.stroke();
  }

  copyRegion() {
    const regionCursor = this.normaliseSelectionCursors();

    this.copybuffer = [];

    for (let r = regionCursor.row_start; r <= regionCursor.row_end; r += 1) {
      const copyrow = [];
      for (let t = regionCursor.track_start; t <= regionCursor.track_end; t += 1) {
        const data = song.getTrackDataForPatternRow(state.cursor.get('pattern'), r, t);
        const coli = (t === regionCursor.track_start) ? regionCursor.column_start : 0;
        const cole = (t === regionCursor.track_end) ? regionCursor.column_end : song.getTrackNumColumns(t) - 1;
        for (let c = coli; c <= cole; c += 1) {
          const itemi = (t === regionCursor.track_start && c === regionCursor.column_start) ? regionCursor.item_start : 0;
          const iteme = (t === regionCursor.track_end && c === regionCursor.column_end) ? regionCursor.item_end : song.eventIndices.length - 1;
          if ('notedata' in data && data.notedata.length > 0) {
            const event = {};
            for (let i = itemi; i <= iteme; i += 1) {
              const itemName = song.eventEntries[song.eventIndices[i].itemIndex];
              event[itemName] = data.notedata[c][itemName] || song.emptyEvent[itemName];
            }
            copyrow.push(event);
          } else {
            const event = {};
            for (let i = itemi; i <= iteme; i += 1) {
              const itemName = song.eventEntries[song.eventIndices[i].itemIndex];
              event[itemName] = song.emptyEvent[itemName];
            }
            copyrow.push(event);
          }
        }
      }
      this.copybuffer.push(copyrow);
    }
  }

  pasteRegion() {
    if (state.cursor.get('record') && this.copybuffer && this.copybuffer.length > 0) {
      const pattern = state.cursor.get('pattern');
      const row = state.cursor.get('row');

      state.groupHistoryStart('Paste region');
      for (let r = 0; r < this.copybuffer.length; r += 1) {
        let track = state.cursor.get('track');
        let column = state.cursor.get('column');
        const maxcol = song.getTrackNumColumns(track);

        let trackdata = song.getTrackDataForPatternRow(pattern, row + r, track);
        let notedata = ('notedata' in trackdata) ? trackdata.notedata : [];
        for (let c = 0; c < this.copybuffer[r].length;) {
          while (column < maxcol) {
            const event = Object.assign(notedata[column] || {}, this.copybuffer[r][c]);
            try {
              song.setEventAtPattarnRowTrackColumn(pattern, row + r, track, column, event);
            } catch (e) {
              console.log(e.message);
            }
            column += 1;
            c += 1;
          }
          column = 0;
          track += 1;
          if (track >= song.getNumTracks()) {
            break;
          }
          trackdata = song.getTrackDataForPatternRow(pattern, row + r, track);
          notedata = ('notedata' in trackdata) ? trackdata.notedata : [];
        }
      }
      state.groupHistoryEnd();

      this.redrawCanvas();
    }
  }

  refresh() {
    $(this.target).empty();
    this.render();
    this.redrawCanvas();
  }

  onScroll(e) {
    if (!e.altKey) {
      if (Math.abs(e.originalEvent.deltaY) > Math.abs(e.originalEvent.deltaX)) {
        let row = state.cursor.get('row') + Math.sign(e.originalEvent.deltaY);
        const maxrow = song.getPatternRowCount(state.cursor.get('pattern'));
        row = ((row % maxrow) + maxrow) % maxrow;

        state.set({
          cursor: {
            row,
          },
        });
      } else {
        this.patterndata.scrollLeft(this.patterndata.scrollLeft() + e.originalEvent.deltaX);
        this.redrawCanvas();
      }
      e.preventDefault();
    }
  }

  onClick(e) {
    const cursor = this.cursorPositionFromMouse(e);
    if (cursor) {
      state.set({
        cursor,
      });
    }
  }

  cursorPositionFromMouse(e) {
    const xpos = e.offsetX;
    const ypos = e.offsetY;

    const track = Math.floor(xpos / this.patternCellWidth);
    const itemOffset = Math.floor(xpos - (track * this.patternCellWidth));

    let item = 0;
    let cursorItemPos = this.cursorOffsets[item];
    let cursorItemSize = this.cursorSizes[item];
    while (((itemOffset < cursorItemPos)
           || (itemOffset > (cursorItemPos + cursorItemSize)))) {
      item += 1;
      if (item >= this.cursorOffsets.length) {
        return null;
      }
      cursorItemPos += this.cursorOffsets[item];
      cursorItemSize = this.cursorSizes[item];
    }

    const cy = (this.canvas.height / 2) - (this.patternRowHeight / 2);
    const clickRow = Math.floor((ypos - cy) / this.patternRowHeight);
    let row = state.cursor.get('row') + clickRow;

    const maxrow = song.getPatternRowCount(state.cursor.get('pattern'));
    if (row < 0) {
      row = 0;
    } else if (row >= maxrow) {
      row = maxrow;
    }

    return {
      track,
      item,
      row,
    };
  }

  /* eslint no-param-reassign: ['error', { 'props': false }] */
  scrollHorizTo(element, to, duration) {
    const start = element.scrollLeft();
    const change = to - start;
    let currentTime = 0;
    const increment = 20;

    function animateScroll() {
      currentTime += increment;
      element.scrollLeft(easeInOutQuad(currentTime, start, change, duration));
      this.redrawCanvas();
      if (currentTime < duration) {
        setTimeout(animateScroll.bind(this), increment);
      }
    }
    animateScroll.bind(this)();
  }

  onCursorChanged() {
    const widget = $(this.target).parent('.chrome');
    if (widget.length > 0) {
      widget.toggleClass('record', state.cursor.get('record'));
    }

    if (this.lastCursor !== state.cursor) {
      if ((this.lastCursor.get('item') !== state.cursor.get('item'))
          || (this.lastCursor.get('track') !== state.cursor.get('track'))
          || (this.lastCursor.get('column') !== state.cursor.get('column'))) {
        /* If the cursor has moved to a different track, column or item,
         * check if it's still visible and scroll into view if not.
         */
        const pos = this.eventPositionInPatternCanvas(state.cursor.toJS());
        const maxpos = this.patterndata.width();
        const minpos = 0;
        if (((pos.cx + this.patternCellWidth) - this.patterndata.scrollLeft()) > maxpos) {
          this.scrollHorizTo(this.patterndata, ((pos.cx + this.patternCellWidth) - maxpos) + 8, 100);
          // scrollHorizTo will take care of redrawCanvas calls, no need to do that here.
          this.lastCursor = state.cursor;
          return;
        } if ((pos.cx - this.patterndata.scrollLeft()) < minpos) {
          this.scrollHorizTo(this.patterndata, pos.cx - 6, 100);
          // scrollHorizTo will take care of redrawCanvas calls, no need to do that here.
          this.lastCursor = state.cursor;
          return;
        }
      }
      if (this.lastCursor.get('pattern') !== state.cursor.get('pattern')) {
        $(this.target).find('#length').val(song.getPatternRowCount(state.cursor.get('pattern')));
        window.requestAnimationFrame(() => this.redrawCanvas());
        this.lastCursor = state.cursor;
        return;
      }
      window.requestAnimationFrame(() => this.redrawCanvas());
      this.lastCursor = state.cursor;
    }
  }

  onTransportChanged() {
    if (this.lastTransport !== state.transport) {
      $(this.target).find('#step').val(state.transport.get('step'));

      this.lastTransport = state.transport;
    }
  }

  onTrackStateChanged() {
    this.redrawCanvas();
  }

  onEventChanged() {
    this.redrawCanvas();
  }

  onPatternChanged() {
    this.redrawCanvas();
  }

  onSongChanged() {
    // If this is the first song loaded, the font might not be ready.
    if (!this.fontloaded) {
      this.onFontLoaded.push(() => this.onSongChanged());
      return;
    }
    this.lastCursor = new Immutable.Map();
    this.renderEmptyPatternRow();
    this.refresh();
  }

  onSongStateChanged() {
    // If this is the first song loaded, the font might not be ready.
    if (!this.fontloaded) {
      this.onFontLoaded.push(() => this.onSongStateChanged());
      return;
    }
    this.renderEmptyPatternRow();
    this.refresh();
  }

  focus() {
    $(this.target).parents('.chrome').trigger('focus');
  }
}
