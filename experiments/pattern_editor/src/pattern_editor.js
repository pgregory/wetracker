import doT from 'dot';
import $ from 'jquery';

import styles from './styles.css';

import headerTemplate from './components/pattern_editor/templates/header.dot';
import timelineTemplate from './components/pattern_editor/templates/timeline.dot';
import trackviewTemplate from './components/pattern_editor/templates/trackview.dot';
import patternEditorTemplate from './components/pattern_editor/templates/patterneditor.dot';
import eventTemplate from './components/pattern_editor/templates/event.dot';

import Signal from './utils/signal';
import { state } from './state';
import { song } from './utils/songmanager';

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
    this.eventPartial = doT.template(eventTemplate);

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
    Signal.connect(song, "eventChanged", this, "onEventChanged");
  }

  render(target) {
    var def = {
      header: headerTemplate,
      timeline: timelineTemplate,
      trackview: trackviewTemplate,
    };
    try {
      var test = doT.template(patternEditorTemplate, undefined, def);
      $(test(song.song)).appendTo(target);
    } catch(e) {
      console.log(e);
    }

    $('.sideTable').width($('#trackview').width());
    $('.leftSideTable').width($('#trackview').width());
    $('.timeline-header').height($('.track-header').height());
    $('.sideTable').height($('.xscroll').height() - $('#trackheader').height());
    $('#timeline').height($('.xscroll').height() - $('#trackheader').height());

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
      var row = Math.round((this.yoff) / 15.0);
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
    this.lastCursor = state.cursor;
    var rowOffset = state.cursor.get("row") * 15.0;

    this.timeline.scrollTop = rowOffset;
    this.events.scrollTop = rowOffset;

    $('tr.pattern-cursor-row').removeClass('pattern-cursor-row');
    $('.event-cursor').removeClass('event-cursor');

    this.timelineRows.eq(state.cursor.get("row") + 1).addClass('pattern-cursor-row');
    this.patternRows.eq(state.cursor.get("row") + 1).addClass('pattern-cursor-row');

    var itemCursor = this.patternRows.eq(state.cursor.get("row") + 1).find(`.line:eq(${state.cursor.get("track")}) .note-column:eq(${state.cursor.get("column")}) .item:eq(${state.cursor.get("item")})`);
    itemCursor.addClass('event-cursor');

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

  onCursorChanged(state) {
    window.requestAnimationFrame(this.updateCursor.bind(this));
  }

  onEventChanged(cursor) {
    var eventCursor = this.patternRows.eq(cursor.row + 1).find(`.line:eq(${cursor.track}) .note-column:eq(${cursor.column})`);
    var newEvent = song.findEventAtCursor(cursor);
    $(eventCursor).replaceWith(this.eventPartial(newEvent));
  }
}

