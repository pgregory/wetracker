import doT from 'dot';
import $ from 'jquery';
import song from '../data/song.json';

import styles from './styles.css';

import headerTemplate from './components/pattern_editor/templates/header.dot';
import timelineTemplate from './components/pattern_editor/templates/timeline.dot';
import trackviewTemplate from './components/pattern_editor/templates/trackview.dot';
import patternEditorTemplate from './components/pattern_editor/templates/patterneditor.dot';

export default class PatternEditor {
  constructor(setting) {
    this.yoff = 0;
    this.theCursor = {
      row: 0,
      track: 0,
      column: 0,
      item: 0,
    };
    this.lastCursor = {
      row: -1,
      track: 0,
      column: 0,
      item: 0,
    };
    this.events = null;
    this.timeline = null;
    this.xscroll = null;
    this.patternRows = null;
    this.timelineRows = null;
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
    console.log(visibleRows, topPadding, bottomPadding);

    $('.topPadding').height(topPadding*15.0);
    $('.bottomPadding').height(bottomPadding*15.0);

    this.patternRows = document.querySelectorAll('#trackview tr');
    this.timelineRows = document.querySelectorAll('#timeline tr');

    this.events = document.getElementsByClassName("sideTable")[0];
    this.timeline = document.getElementById("timeline");
    this.xscroll = document.getElementsByClassName("xscroll")[0];

    this.events.addEventListener('mousewheel', this.onScroll.bind(this), false);

    window.requestAnimationFrame(this.updateCursor.bind(this));
  }

  onScroll(e) {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      this.yoff += e.deltaY;
      if (this.yoff < 0) {
        this.yoff = (this.events.scrollHeight - this.events.clientHeight) - 8;
      } else if (this.yoff >= ((this.events.scrollHeight - this.events.clientHeight) - 8)) {
        this.yoff = 0;
      }
      this.theCursor.row = Math.round((this.yoff) / 15.0);
    } else {
      this.xscroll.scrollLeft += e.deltaX;
    }
    e.preventDefault();
  }

  updateCursor(timestamp) {
    if(this.lastCursor.row !== this.theCursor.row) {
      this.lastCursor.row = this.theCursor.row;
      var offset = this.theCursor.row * 15.0;

      this.timeline.scrollTop = offset;
      this.events.scrollTop = offset;

      var oldCursorRows = document.querySelectorAll('tr.pattern-cursor-row');
      oldCursorRows.forEach(function(element) {
        element.classList.remove('pattern-cursor-row');
      });

      var timelineRow = this.timelineRows[this.theCursor.row + 1];
      var eventsRow = this.patternRows[this.theCursor.row + 1];
      timelineRow.classList.add('pattern-cursor-row');
      eventsRow.classList.add('pattern-cursor-row');
    }
    window.requestAnimationFrame(this.updateCursor.bind(this));
  }


  play() {
    this.theCursor.row += 1;
    if ((theCursor.row * 15) >= events.scrollHeight - events.clientHeight) {
      theCursor.row = 0;
    }
  }
}

