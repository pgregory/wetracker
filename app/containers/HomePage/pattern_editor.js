import React from 'react';

import '!style!css!./pattern_editor.css';

function renderEvents(events) {
  return events.map((event, index) => (
    <PatternEvent key={index}/>
  ));
}

var PatternEvent = React.createClass({
  render: function() {
    return (
      <div className="line">
        <span className="instrument">C-5</span>
        <span> </span>
        <span className="volume">40</span>
        <span> </span>
        <span className="panning">00</span>
        <span> </span>
        <span className="delay">00</span>
        <span> </span>
        <span className="fx">....</span>
      </div>
    );
  }
});

function renderTracks(tracks) {
  return tracks.map((track, index) => (
    <PatternTrack key={index}/>
  ));
}

var PatternTrack = React.createClass({
  render: function() {
    const events = renderEvents(testEvents);
    return (
      <div className="track">
        <div className="track-header">
          <span>Track 1</span>
        </div>
        { events }
      </div>
    );
  }
});


var TrackTime = React.createClass({
  render: function() {
    return (
      <div className="track-time">
        <div>
          { testEvents && testEvents.map((event, index) => (
            <div key={index} className="line">
              <span className="tick">{ index }</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
});


var testEvents = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
];

var testTracks = [
  1, 2, 3, 4, 5, 6, 7, 8
]

export default class PatternEditor extends React.Component { // eslint-disable-line react/prefer-stateless-function

  render() {
    const tracks = renderTracks(testTracks);
    return (
      <div className="pattern-editor">
        <div className="trackview">
          <TrackTime/>
          <div className="tracks">
            { tracks } 
          </div>
        </div>
      </div>
    );
  }
}

