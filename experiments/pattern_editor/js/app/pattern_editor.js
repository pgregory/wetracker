define(["lib/doT"], function(doT) {
  return {
    render: function() {
      var timeline_header_template = 
        '<table>' + 
        '  <thead>' +
        '    <tr class="row">' +
        '      <th class="tick">' +
        '        <div class="time-header" style="height: 55px;"><br /></div>' +
        '      </th>' +
        '    </tr>' + 
        '  </thead>' +
        '</table>';

      var timeline_template =
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

      var header_template =
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

      var trackview_template =
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

      var timelineHeaderTemplate = doT.template(timeline_header_template);
      document.getElementById('timeline-header').innerHTML = timelineHeaderTemplate(this.song);

      var timelineTemplate = doT.template(timeline_template);
      document.getElementById('timeline').innerHTML = timelineTemplate(this.song);

      var trackviewTemplate = doT.template(trackview_template);
      try {
        document.getElementById('trackview').innerHTML = trackviewTemplate(this.song);
      } catch(e) {
        console.log(e);
      }

      var headerTemplate = doT.template(header_template);
      document.getElementById('trackheader').innerHTML = headerTemplate(this.song);

      this.patternRows = document.querySelectorAll('#trackview tr');
      this.timelineRows = document.querySelectorAll('#timeline tr');

      this.events = document.getElementsByClassName("sideTable")[0];
      this.timeline = document.getElementById("timeline");
      this.xscroll = document.getElementsByClassName("xscroll")[0];

      window.requestAnimationFrame(this.updateCursor);
    },

    yoff: 0,
    theCursor: 0,
    lastCursor: null,
    events: null,
    timeline: null,
    xscroll: null,
    patternRows: null,
    timelineRows: null,

    onScroll: function(e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        yoff += e.deltaY;
        if (yoff < 0) {
          yoff = events.scrollHeight - events.clientHeight;
        } else if (yoff >= events.scrollHeight - events.clientHeight) {
          yoff = 0;
        }
        theCursor = Math.round((yoff) / 15.0);
      } else {
        xscroll.scrollLeft += e.deltaX;
      }
      e.preventDefault();
    },

    updateCursor: function(timestamp) {
      if((!this.lastCursor) || (this.lastCursor !== this.theCursor)) {
        this.lastCursor = this.theCursor;
        var offset = this.theCursor * 15.0;

        this.timeline.scrollTop = offset;
        this.events.scrollTop = offset;

        var oldCursorRows = document.querySelectorAll('tr.pattern-cursor-row');
        oldCursorRows.forEach(function(element) {
          element.classList.remove('pattern-cursor-row');
        });

        var timelineRow = timelineRows[theCursor+1];
        var eventsRow = patternRows[theCursor+1];
        timelineRow.classList.add('pattern-cursor-row');
        eventsRow.classList.add('pattern-cursor-row');
      }
      window.requestAnimationFrame(updateCursor);
    },


    play: function() {
      theCursor += 1;
      if ((theCursor * 15) >= events.scrollHeight - events.clientHeight) {
        theCursor = 0;
      }
    },

    song: {
      tracks: [{
        notecolumns: 2,
        fxcolumns: 1,
        name: 'Lead',
        type: 'play',
        color: '#008800',
      }, {
        notecolumns: 1,
        fxcolumns: 1,
        name: 'Bass',
        type: 'play',
        color: '#880000',
      }, {
        notecolumns: 1,
        fxcolumns: 1,
        name: 'Lead1',
        type: 'play',
        color: '#000088',
      }, {
        notecolumns: 1,
        fxcolumns: 1,
        name: 'Pad',
        type: 'play',
        color: '#008888',
      }, {
        notecolumns: 1,
        fxcolumns: 1,
        name: 'Track5',
        type: 'play',
        color: '#880088',
      }, {
        notecolumns: 1,
        fxcolumns: 1,
        name: 'Track 6',
        type: 'play',
        color: '#888800',
      }, {
        notecolumns: 1,
        fxcolumns: 1,
        name: 'Track 7',
        type: 'play',
        color: '#888844',
      }],
      instruments: [
        {
          name: 'piano',
          type: 'sampler',
          samples: [
            {
              url: '/assets/audio/Korg-M3R-Grand-Piano-C1.wav',
              base: 'C1',
              rangeStart: 'C1',
              rangeEnd: 'B2',
            },
            {
              url: '/assets/audio/Korg-M3R-Grand-Piano-C3.wav',
              base: 'C3',
              rangeStart: 'C3',
              rangeEnd: 'B4',
            },
            {
              url: '/assets/audio/Korg-M3R-Grand-Piano-C5.wav',
              base: 'C5',
              rangeStart: 'C5',
              rangeEnd: 'C9',
            },
          ],
          data: {
            envelope: {
              attack: 0.00,
              decay: 2.0,
              sustain: 1.0,
              release: 5.9,
            },
          },
        },
        {
          name: 'buzz',
          type: 'synth',
          data: {
            oscillator: {
              type: 'square',
              modulationFrequency: 0.2,
            },
            envelope: {
              attack: 0.02,
              decay: 0.1,
              sustain: 0.2,
              release: 1.9,
            },
          },
        },
        {
          name: 'tom',
          type: 'membrane',
          data: {
            pitchDecay: 0.008,
            octaves: 2,
            envelope: {
              attack: 0.0006,
              decay: 0.5,
              sustain: 0,
            },
          },
        },
        {
          name: 'cymbal',
          type: 'metal',
          data: {
            harmonicity: 2,
            resonance: 800,
            modulationIndex: 20,
            envelope: {
              decay: 0.8,
            },
            volume: -35,
          },
        },
      ],
      patterns: [{
        rows: 32,
        trackdata: [{
          notedata: [
            [ {note: 'B#4'}, {note: 'C-4'} ],
          ],
        }],
      }],
    },
  }
});

