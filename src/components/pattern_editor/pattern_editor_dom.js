import $ from 'jquery';

import styles_dom from './styles_dom.css';
import styles from './styles.css';

import { connect } from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';
import { player, MUTE, SILENT } from '../../audio/player';
import Immutable from 'immutable';

import patternEditorMarko from './templates/patterneditor_dom.marko';
import eventTemplate from './templates/event.dot';

import { toNote, toInstrument, toVolume, toPanning, toDelay, toFX } from './templates/utils';

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

export default class PatternEditorDOM {
  constructor(target) {
    this.yoff = 0;
    this.xoff = 0;
    this.lastCursor = state.cursor;
    this.events = null;
    this.timeline = null;
    this.xscroll = null;
    this.patternRows = null;
    this.timelineRows = null;
		this.patternRowHeight = 13;

    this.target = target;

    connect(state, "cursorChanged", this, "onCursorChanged");
    connect(song, "eventChanged", this, "onEventChanged");
    connect(state, 'transportChanged', this, 'onTransportChanged');
    connect(song, 'songChanged', this, 'onSongChanged');
    connect(song, 'patternChanged', this, 'onPatternChanged');
    connect(song, 'sequenceChanged', this, 'onSequenceChanged');
    connect(song, 'sequenceItemChanged', this, 'onSequenceItemChanged');
    connect(state, 'songChanged', this, 'onSongStateChanged');
    connect(player, 'trackStateChanged', this, 'onTrackStateChanged');

    window.requestAnimationFrame(this.updateCursor.bind(this));
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }

  render() {
    var pattern = state.song.getIn(['patterns', state.cursor.get('pattern')]);
    var tracknames = song.getTrackNames();
    var rows = state.song.getIn(['patterns', state.cursor.get('pattern'), 'rows']) || new Immutable.Map();

    console.log(rows.size);

    try {
      $(this.target).html(patternEditorMarko.renderToString({ 
        pattern, 
        tracknames, 
        rows,
        cursor: state.cursor.toJS() }));
    } catch(e) {
      console.log(e);
    }

    $(".track-header").each( (i, v) => {
      $(v).data('initialLeft', $(v).position().left);
    });
    $(".trackview").on('wheel', this.onScroll.bind(this));

    // Cache node references for all note data to enable quick pattern refresh.

    this.row_cache = [];
    $("#trackview .row").each( (i,v) => {
      var row = [];
      $(v).find('td.trackrow').each( (i2, t) => {
        var trackid = $(t).data('trackid');
        var track = {
          id: trackid,
          columns: []
        };
        $(t).find('.line .note-column').each( (i3,n) => {
          var notecolid = $(n).data('columnid');
          var notecol = {
            id: notecolid,
            note: $(n).find('.item.note'),
            instrument: $(n).find('.item.instrument'),
            volume: $(n).find('.item.volume'),
            panning: $(n).find('.item.panning'),
            delay: $(n).find('.item.delay'),
            fx: $(n).find('.item.fx'),
          };
          try {
            notecol['eventdata'] = song.song.patterns[state.cursor.get('pattern')].rows[i][trackid].notedata[notecolid];
          } catch(e) {
            notecol['eventdata'] = undefined;
          }
          track.columns.push(notecol);
        });
        row.push(track);
      });
      this.row_cache.push(row);
    });
    //this.redrawAllRows();
  }

  onScroll(e) {
    if (Math.abs(e.originalEvent.deltaY) > Math.abs(e.originalEvent.deltaX)) {
      this.yoff += e.originalEvent.deltaY;
      if (Math.abs(this.yoff) >= this.patternRowHeight) {
        const rowIncr = Math.floor(this.yoff / this.patternRowHeight);
        let row = state.cursor.get('row') + rowIncr;
        const maxrow = song.getPatternRowCount(state.cursor.get('pattern'));
        row = ((row % maxrow) + maxrow) % maxrow;
        //row = Math.max(0, Math.min(row, maxrow));
        state.set({
          cursor: {
            row,
          },
        });
        this.yoff -= (rowIncr * this.patternRowHeight);
				$(".trackview").scrollTop(row * this.patternRowHeight);
				$(".row-numbers").each( (i, v) => {
					$(v).css({top: -(row * this.patternRowHeight)});
				});
      }
    } else {
			let xoff = $(".trackview").scrollLeft() + e.originalEvent.deltaX;
			$(".trackview").scrollLeft(xoff);
			$(".track-header").each( (i, v) => {
				$(v).css({left: $(v).data('initialLeft') - $(".trackview").scrollLeft()});
			});
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
    if(state.cursor.get('pattern') !== this.lastCursor.pattern) {
      this.redrawAllRows();
      //$(this.target).empty();
      //this.render(this.target);
    }
    var rowOffset = state.cursor.get("row") * 15.0;

    //this.timeline.scrollTop = rowOffset;
    //this.events.scrollTop = rowOffset;

    $('tr.pattern-cursor-row').removeClass('pattern-cursor-row');
    $('.event-cursor').removeClass('event-cursor');

    //this.timelineRows.eq(state.cursor.get("row") + 1).addClass('pattern-cursor-row');
    //this.patternRows.eq(state.cursor.get("row") + 1).addClass('pattern-cursor-row');

    //var itemCursor = this.patternRows.eq(state.cursor.get("row") + 1).find(`.line:eq(${state.cursor.get("track")}) .note-column:eq(${state.cursor.get("column")}) .item:eq(${state.cursor.get("item")})`);
    //itemCursor.addClass('event-cursor');

    /* If the cursor has moved to a different track, column or item,
     * check if it's still visible and scroll into view if not.
     */
    /*if ((this.lastCursor.item !== state.cursor.get("item")) ||
        (this.lastCursor.track !== state.cursor.get("track")) ||
        (this.lastCursor.column !== state.cursor.get("column"))) {
      const item = itemCursor[0].parentElement;
      let offsetParent = item.offsetParent;
      let offset = item.offsetLeft;
      while (!(offsetParent.parentElement.classList.contains('sideTable'))) {
        offset += offsetParent.offsetLeft;
        offsetParent = offsetParent.offsetParent;
      }

      if (((offset + item.clientWidth) - this.xscroll.scrollLeft) > this.events.parentElement.clientWidth) {
        this.scrollHorizTo(this.xscroll, ((offset + item.clientWidth) - this.events.parentElement.clientWidth) + 6, 100);
      } else if (offset < this.xscroll.scrollLeft) {
        this.scrollHorizTo(this.xscroll, offset - 6, 100);
      }
    }*/
    this.lastCursor = state.cursor.toJS();
  }

  onCursorChanged(state) {
    window.requestAnimationFrame(this.updateCursor.bind(this));
  }

  onTransportChanged() {
    /*if (this.lastTransport !== state.transport) {
      $(this.target).find('#step').val(state.transport.get('step'));

      this.lastTransport = state.transport;
    }*/
  }

  onTrackStateChanged() {
    //this.redrawCanvas();
  }

  onEventChanged(cursor, event) {
    /*const pos = this.eventPositionInPatternCanvas(cursor);
    const patternCanvas = this.getPatternCanvasForSequence(state.cursor.get('sequence'));
    const ctx = patternCanvas.getContext('2d');
    this.clearEvent(ctx, pos.cx, pos.cy);
    this.renderEvent(ctx, event, pos.cx + this.eventLeftMargin, pos.cy + ((this.patternRowHeight - 8) / 2));
    this.renderEventBeat(ctx, cursor, pos.cx, pos.cy);
    this.redrawCanvas();*/
  }

  onPatternChanged() {
    //this.renderSinglePattern(state.cursor.get('pattern'));
    //this.redrawCanvas();
    this.refresh();
  }

  onSequenceChanged() {
    //this.renderAllPatterns();
    this.refresh();
  }

  onSequenceItemChanged(sequence) {
    //const patternIndex = song.getSequencePatternNumber(sequence);
    //this.patternCanvases[patternIndex] = this.renderPattern(patternIndex);
    this.refresh();
  }

  onSongChanged() {
    //this.lastCursor = new Immutable.Map();
    //this.renderEmptyPatternCache();
    //this.renderAllPatterns();
    this.refresh();
  }

  onSongStateChanged() {
    //this.renderEmptyPatternCache();
    //this.renderAllPatterns();
    this.refresh();
  }

  redrawAllRows() {
    const curr_pattern_id = state.cursor.get('pattern');
    const curr_pattern = state.song.getIn('patterns', curr_pattern_id);

    for(var rowi = 0, rowe = this.row_cache.length; rowi < rowe; rowi += 1) {
      const display_row = this.row_cache[rowi];
      const curr_row = curr_pattern.rows[rowi]; 
      for(var tracki = 0, tracke = display_row.length; tracki < tracke; tracki += 1) {
        const display_track = display_row[tracki];
        const curr_track = curr_row[display_track.id];
        for(var notecoli = 0, notecole = display_track.columns.length; notecoli < notecole; notecoli += 1) {
          const display_notecol = display_track.columns[notecoli];
          const curr_notecol = curr_track.notedata[song.song.tracks[tracki].columns[notecoli].id];
          // If there is data in the new pattern, check if we need to render it.
          if(curr_notecol) {
            const diff = (curr_notecol.note !== display_notecol.eventdata.note) ||
                         (curr_notecol.instrument !== display_notecol.eventdata.instrument) ||
                         (curr_notecol.volume !== display_notecol.eventdata.volume) ||
                         (curr_notecol.panning !== display_notecol.eventdata.panning) ||
                         (curr_notecol.delay !== display_notecol.eventdata.delay) ||
                         (curr_notecol.fxtype !== display_notecol.eventdata.fxtype) ||
                         (curr_notecol.fxparam !== display_notecol.eventdata.fxparam);
            if(diff) {
              display_notecol.note[0].innerHTML = toNote(curr_notecol.note);
              display_notecol.instrument[0].innerHTML = toInstrument(curr_notecol.instrument);
              display_notecol.volume[0].innerHTML = toVolume(curr_notecol.volume);
              display_notecol.panning[0].innerHTML = toPanning(curr_notecol.panning);
              display_notecol.delay[0].innerHTML = toDelay(curr_notecol.delay);
              display_notecol.fx[0].innerHTML = toFX(curr_notecol.fxtype, curr_notecol.fxparam);
            }
          } else {
            // If the new pattern is empty in this event, but the previous wasn't, empty it.
            if(display_notecol.notedata) {
              display_notecol.note[0].innerHTML = toNote(undefined);
              display_notecol.instrument[0].innerHTML = toInstrument(undefined);
              display_notecol.volume[0].innerHTML = toVolume(undefined);
              display_notecol.panning[0].innerHTML = toPanning(undefined);
              display_notecol.delay[0].innerHTML = toDelay(undefined);
              display_notecol.fx[0].innerHTML = toFX(undefined, undefined);
            }
          }
        }
      }
    }
  }

  redrawRow(row) {
    for(var track in song.song.tracks) {
      for(var column in song.song.tracks[track].columns) {
        var rowcursor = state.cursor.merge({
          row,
          track,
          column,
        });
        this.onEventChanged(rowcursor.toJS());
      }
    }
  }

  onEventChanged(cursor) {
    var eventCursor = this.patternRows.eq(cursor.row + 1).find(`.line:eq(${cursor.track}) .note-column:eq(${cursor.column})`);
    var newEvent = song.findEventAtCursor(cursor);
    $(eventCursor).replaceWith(this.eventPartial(newEvent));
  }
}

