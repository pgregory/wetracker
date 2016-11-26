import doT from 'dot';
import $ from 'jquery';
import song from '../data/song.json';

import styles from './styles.css';

import headerTemplate from './components/pattern_editor/templates/header.dot';
import timelineTemplate from './components/pattern_editor/templates/timeline.dot';
import trackviewTemplate from './components/pattern_editor/templates/trackview.dot';
import patternEditorTemplate from './components/pattern_editor/templates/patterneditor.dot';

import Signal from './utils/signal';
import { state } from './state';

console.log(state);

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
  }

  render(target) {
    var def = {
      header: headerTemplate,
      timeline: timelineTemplate,
      trackview: trackviewTemplate,
    };
    try {
      var test = doT.template(patternEditorTemplate, undefined, def);
      $(test(song)).appendTo(target);
    } catch(e) {
      console.log(e);
    }

    $('.sideTable').width($('#trackview').width());
    $('.leftSideTable').width($('#trackview').width());
    $('#timeline-header').height($('#trackheader').height());
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

  updateCursor(timestamp) {
    this.lastCursor = state.cursor;
    var offset = state.cursor.get("row") * 15.0;

    this.timeline.scrollTop = offset;
    this.events.scrollTop = offset;

    $('tr.pattern-cursor-row').removeClass('pattern-cursor-row');
    $('.event-cursor').removeClass('event-cursor');

    this.timelineRows.eq(state.cursor.get("row") + 1).addClass('pattern-cursor-row');
    this.patternRows.eq(state.cursor.get("row") + 1).addClass('pattern-cursor-row');

    this.patternRows.eq(state.cursor.get("row") + 1).find(`.line:eq(${state.cursor.get("track")}) .note-column:eq(${state.cursor.get("column")}) .item:eq(${state.cursor.get("item")})`).addClass('event-cursor');
  }

  onCursorChanged(state) {
    window.requestAnimationFrame(this.updateCursor.bind(this));
  }
}

