import doT from 'dot';
import $ from 'jquery';
import song from '../data/song.json';

import styles from './styles.css';

export default class PatternEditor {
  constructor(setting) {
    this.yoff = 0;
    this.theCursor = {
      row: 0,
      track: 0,
      column: 0,
      item: 0,
    };
    this.lastCursor = this.theCursor;
    this.events = null;
    this.timeline = null;
    this.xscroll = null;
    this.patternRows = null;
    this.timelineRows = null;

    this.headerTemplate = 
      '<table id="header-table">' +
      '  <thead>' +
      '    <tr>' +
      '      {{ for(var track in it.tracks) { }}' +
      '      <th>' +
      '        <div class="track-header" style="width: {{=it.tracks[track].notecolumns * 150}}px;">' +
      '          <span>{{=it.tracks[track].name}}</span>' +
      '          <div class="track-color" style="background: {{=it.tracks[track].color}};"></div>' +
      '          <div class="track-controls">' +
      '            <button>-</button>' +
      '            <button>+</button>' +
      '          </div>' +
      '        </div>' +
      '      </th>' +
      '      {{ } }}' +
      '    </tr>' +
      '  </thead>' +
      '</table>';

    this.timelineTemplate = 
      '<table>' +
      '  <tbody>' +
      '    <tr class="row">' +
      '      <th class="tick">' +
      '        <div style="height: calc(7 * 15px)"></div>' +
      '      </th>' +
      '    </tr>' +
      '    {{ for(var row = 0; row < it.patterns[0].rows; ++row) { }}' +
      '      <tr class="row"><th class="tick">{{=row}}</th></tr>' +
      '    {{ } }}' +
      '    <tr class="row">' +
      '      <th class="tick">' +
      '        <div style="height: calc(7 * 15px);"></div>' +
      '      </th>' +
      '    </tr>' +
      '  </tbody>' +
      '</table>';

    this.trackviewTemplate = 
      '{{##def.event:data:' +
      '  {{? data }}' +
      '    <div class="note">{{=data.note || "---"}}</div>' +
      '    <div class="instrument">{{=data.instrument || "--"}}</div>' +
      '    <div class="volume">{{=data.volume || "--"}}</div>' +
      '    <div class="panning">{{=data.panning || "--"}}</div>' +
      '    <div class="delay">{{=data.delay || "--"}}</div>' +
      '    <div class="fx">{{=data.fx || "----"}}</div>' +
      '  {{?? }}' +
      '    <div class="note">---</div>' +
      '    <div class="instrument">--</div>' +
      '    <div class="volume">--</div>' +
      '    <div class="panning">--</div>' +
      '    <div class="delay">--</div>' +
      '    <div class="fx">----</div>' +
      '  {{? }}' +
      '#}}' +
      '<tbody>' +
      '  <tr>' +
      '    {{ for(var i = 0; i < 7; ++i) { }}' +
      '    <td><div style="height: calc(7 * 15px)"></div></td>' +
      '    {{ } }}' +
      '  </tr>' +
      '  {{ for(var row = 0; row < it.patterns[0].rows; row++ ) { }}' +
      '  <tr class="row pattern-cursor-row">' +
      '    {{ for(var track in it.tracks) { }}' +
      '    <td>' +
      '      <div class="line">' +
      '        {{ for(var notecol = 0; notecol < it.tracks[track].notecolumns; notecol++) { }}' +
      '          {{? it.patterns[0].trackdata.length > track && ' +
      '              "notedata" in it.patterns[0].trackdata[track] &&' +
      '              it.patterns[0].trackdata[track].notedata.length > row &&' +
      '              it.patterns[0].trackdata[track].notedata[row].length > notecol }}' +
      '            {{ var param = it.patterns[0].trackdata[track].notedata[row][notecol]; }}' +
      '            {{#def.event:param}}' +
      '          {{?? }}' +
      '            {{#def.event:null}}' +
      '          {{? }}' +
      '        {{ } }}' +
      '      </div>' +
      '    </td>' +
      '    {{ } }}' +
      '  </tr>' +
      '  {{ } }}' +
      '  <tr>' +
      '    {{ for(var i = 0; i < 7; ++i) { }}' +
      '    <td><div style="height: calc(7 * 15px)"></div></td>' +
      '    {{ } }}' +
      '  </tr>' +
      '</tbody>';

    this.patternEditorTemplate = 
      '<div class="pattern-editor">' +
      '  <div style="float: left;">' +
      '    <div id="timeline-header">' +
      '    </div>' +
      '    <div id="timeline" style="height: 210px;">' +
      '     {{#def.timeline}}' +
      '    </div>' +
      '  </div>' +
      '  <div style="float: left; width: calc(150 * 7);" class="xscroll">' +
      '    <div id="trackheader" class="leftSideTable" style="width: 1070px;">' +
      '     {{#def.header}}' +
      '    </div>' +
      '    <div style="height: 210px; width: 1070px;" class="sideTable">' +
      '      <table id="trackview">' +
      '        {{#def.trackview}}' +
      '      </table>' +
      '    </div>' +
      '  </div>' +
      '</div>';
  }

  render(target) {
    var def = {
      header: this.headerTemplate,
      timeline: this.timelineTemplate,
      trackview: this.trackviewTemplate,
    };
    try {
      var test = doT.template(this.patternEditorTemplate, undefined, def);
      $(test(song)).appendTo(target);
    } catch(e) {
      console.log(e);
    }

    $('.sideTable').width($('#trackview').width());
    $('.leftSideTable').width($('#trackview').width());
    $('#timeline-header').height($('#trackheader').height());

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
        this.yoff = this.events.scrollHeight - this.events.clientHeight;
      } else if (this.yoff >= this.events.scrollHeight - this.events.clientHeight) {
        this.yoff = 0;
      }
      this.theCursor.row = Math.round((this.yoff) / 15.0);
    } else {
      this.xscroll.scrollLeft += e.deltaX;
    }
    e.preventDefault();
  }

  updateCursor(timestamp) {
    if((!this.lastCursor) || (this.lastCursor !== this.theCursor.row)) {
      this.lastCursor = this.theCursor.row;
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

