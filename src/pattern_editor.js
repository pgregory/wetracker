import $ from 'jquery';

import styles from './styles.css';

import Signal from './utils/signal';
import { state } from './state';
import { song } from './utils/songmanager';

import patternEditorMarko from './components/pattern_editor/templates/patterneditor.marko';
import eventTemplate from './components/pattern_editor/templates/event.dot';

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
          track.columns.push({
            id: notecolid,
            note: $(n).find('.item.note'),
            instrument: $(n).find('.item.instrument'),
            volume: $(n).find('.item.volume'),
            panning: $(n).find('.item.panning'),
            delay: $(n).find('.item.delay'),
            fx: $(n).find('.item.fx'),
          });
        });
        row.push(track);
      });
      this.row_cache.push(row);
    });
    this.redrawAllRows();

    $('.sideTable').width($('#trackview').width());
    $('.leftSideTable').width($('#trackview').width());
    $('.timeline-header').height($('.track-header').height());
    $('.sideTable').height($('.xscroll').height() - $('#trackheader').height());
    $('#timeline').height($('.xscroll').height() - $('#trackheader').height());

    $('.track-header').each( (i,v) => {
      $(v).width($(`#trackview td[data-trackid="${$(v).data('trackid')}"]`).width());
    });

    var visibleRows = Math.floor(($('.xscroll').height() - $('#trackheader').height()) / 15.0);
    var topPadding = Math.floor(visibleRows/2.0);
    var bottomPadding = Math.ceil(visibleRows/2.0);

    $('.topPadding').height(topPadding*15.0);
    $('.bottomPadding').height(bottomPadding*15.0);

    this.patternRows = $('#trackview tr');
    this.timelineRows = $('#timeline tr');

    this.events = $(".sideTable")[0];
    this.timeline = $("#timeline")[0];
    this.xscroll = $(".xscroll")[0];

    $('.sideTable').on('mousewheel', this.onScroll.bind(this));

    this.target = target;

    window.requestAnimationFrame(this.updateCursor.bind(this));
  }

  onScroll(e) {
    if (Math.abs(e.originalEvent.deltaY) > Math.abs(e.originalEvent.deltaX)) {
      this.yoff += e.originalEvent.deltaY;
      if (this.yoff < 0) {
        this.yoff = (this.events.scrollHeight - this.events.clientHeight) - 8;
      } else if (this.yoff >= ((this.events.scrollHeight - this.events.clientHeight) - 8)) {
        this.yoff = 0;
      }
      var row = Math.floor((this.yoff) / 15.0);
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
    if(state.cursor.get('pattern') !== this.lastCursor.pattern) {
      this.redrawAllRows();
      //$(this.target).empty();
      //this.render(this.target);
    }
    var rowOffset = state.cursor.get("row") * 15.0;

    this.timeline.scrollTop = rowOffset;
    this.events.scrollTop = rowOffset;

    $('tr.pattern-cursor-row').removeClass('pattern-cursor-row');
    $('.event-cursor').removeClass('event-cursor');

    this.timelineRows.eq(state.cursor.get("row") + 1).addClass('pattern-cursor-row');
    this.patternRows.eq(state.cursor.get("row") + 1).addClass('pattern-cursor-row');

    var itemCursor = this.patternRows.eq(state.cursor.get("row") + 1).find(`.line:eq(${state.cursor.get("track")}) .note-column:eq(${state.cursor.get("column")}) .item:eq(${state.cursor.get("item")})`);
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
    for(var rowi = 0, rowe = this.row_cache.length; rowi < rowe; rowi += 1) {
      for(var tracki = 0, tracke = this.row_cache[rowi].length; tracki < tracke; tracki += 1) {
        for(var notecoli = 0, notecole = this.row_cache[rowi][tracki].columns.length; notecoli < notecole; notecoli += 1) {
          const notecol = this.row_cache[rowi][tracki].columns[notecoli];
          notecol.note[0].innerHTML = '...';
          notecol.instrument[0].innerHTML = '~~';
          notecol.volume[0].innerHTML = '^^';
          notecol.panning[0].innerHTML = '<>';
          notecol.delay[0].innerHTML = ',,';
          notecol.fx[0].innerHTML = '****';
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

