import $ from 'jquery';

import styles from './styles.css';

import Signal from './utils/signal';
import { state } from './state';
import { song } from './utils/songmanager';

import patternEditorMarko from './components/pattern_editor/templates/patterneditor.marko';

import { toNote, toInstrument, toVolume, toPanning, toDelay, toFX } from './components/pattern_editor/templates/utils';

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

export default class PatternEditor {
  constructor() {
    this.yoff = 0;
    this.lastCursor = state.cursor;
    this.events = null;
    this.timeline = null;
    this.xscroll = null;
    this.patternRows = null;
    this.timelineRows = null;
    this.rendered = false;

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
    Signal.connect(song, "eventChanged", this, "onEventChanged");
  }

  render(target) {
    try {
      $(target).html(patternEditorMarko.renderToString({ song: song.song, cursor: state.cursor.toJS() }));
    } catch(e) {
      console.log(e);
    }

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
    console.log(this.row_cache);

    $('.sideTable').width($('#trackview').width());
    $('.leftSideTable').width($('#trackview').width());
    $('.timeline-header').height($('.track-header').height());
    $('.sideTable').height($('.xscroll').height() - $('#trackheader').height());
    $('#timeline').height($('.xscroll').height() - $('#trackheader').height());

    $('.track-header').each( (i,v) => {
      $(v).width($(`#trackview td[data-trackid="${$(v).data('trackid')}"]`).width());
    });

    this.visibleRows = Math.floor(($('.xscroll').height() - $('#trackheader').height()) / 15.0);
    this.topPadding = Math.floor(this.visibleRows/2.0);
    this.bottomPadding = Math.ceil(this.visibleRows/2.0);

    //$('.topPadding').height(this.topPadding*15.0);
    //$('.bottomPadding').height(this.bottomPadding*15.0);

    this.patternRows = $('#trackview tr.row');
    this.timelineRows = $('#timeline tr.row');

    this.events = $(".sideTable")[0];
    this.timeline = $("#timeline")[0];
    this.xscroll = $(".xscroll")[0];

    $('.sideTable').on('mousewheel', this.onScroll.bind(this));

    this.target = target;

    window.requestAnimationFrame(this.updateCursor.bind(this));
    this.rendered = true;
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
    if(!this.rendered) {
      return;
    }
    if(state.cursor.get('pattern') !== this.lastCursor.pattern) {
      this.redrawAllRows();
      //$(this.target).empty();
      //this.render(this.target);
    }
    var rowOffset = (state.cursor.get("row") * 15.0) + ((song.song.patterns[state.cursor.get('pattern')].numrows - this.topPadding) * 15.0);

    this.timeline.scrollTop = rowOffset;
    this.events.scrollTop = rowOffset;

    $('#trackview').find('tr.pattern-cursor-row').removeClass('pattern-cursor-row');
    $('.event-cursor').removeClass('event-cursor');

    //this.timelineRows.eq(state.cursor.get("row")).addClass('pattern-cursor-row');
    //this.patternRows.eq(state.cursor.get("row")).addClass('pattern-cursor-row');

    var itemCursor = this.patternRows.eq(state.cursor.get("row")).find(`.line:eq(${state.cursor.get("track")}) .note-column:eq(${state.cursor.get("column")}) .item:eq(${state.cursor.get("item")})`);
    itemCursor.addClass('event-cursor');

    /* If the cursor has moved to a different track, column or item,
     * check if it's still visible and scroll into view if not.
     */
    if ((this.lastCursor.item !== state.cursor.get("item")) ||
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
    }
    this.lastCursor = state.cursor.toJS();
  }

  onCursorChanged(state) {
    window.requestAnimationFrame(this.updateCursor.bind(this));
  }

  redrawAllRows() {
    const curr_pattern_id = state.cursor.get('pattern');
    const curr_pattern = song.song.patterns[curr_pattern_id];

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
          if(curr_notecol && display_notecol && display_notecol.eventdata) {
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

