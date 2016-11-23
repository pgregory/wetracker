/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 *
 * NOTE: while this component should technically be a stateless functional
 * component (SFC), hot reloading does not currently support SFCs. If hot
 * reloading is not a necessity for you then you can refactor it and remove
 * the linting exception.
 */

/* eslint-disable global-require */
import React from 'react';
import PatternEditor from 'components/PatternEditor';

import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import {
  selectCursor,
  selectSong,
  selectTransport,
  selectInstrumentCursor,
} from 'containers/App/selectors';

import {
  cursorSetRow,
  cursorSetTrackItem,
  cursorUp,
  cursorDown,
  cursorLeft,
  cursorRight,
  setNoteAtCursor,
  cursorTrackLeft,
  cursorTrackRight,
  forceRefresh,
  doneRefresh,
  setNoteColumns,
} from 'containers/App/actions';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

/* eslint-disable import/no-webpack-loader-syntax */
import '!style!css!./styles.css';

if (process.env.NODE_ENV !== 'production') {
  window.ReactPerf = require('react-addons-perf');
  // const {whyDidYouUpdate} = require('why-did-you-update')
  // whyDidYouUpdate(React, { include: /^Row$/ })
}


function Chrome(props) {
  /* Note: this relies on the border of "widget-container" being 5px
  *  and the height of the header being 15px */
  const innerWidth = parseInt(props.width.slice(0, -2), 10) - 10;
  const innerHeight = parseInt(props.height.slice(0, -2), 10) - 25;

  const newChildren = React.Children.map(props.children, (child) =>
      React.cloneElement(child, { width: innerWidth, height: innerHeight })
    );
  return (
    <div className="widget-container" {...props}>
      <div className="widget-header"></div>
      { newChildren }
    </div>
  );
}

Chrome.propTypes = {
  width: React.PropTypes.string,
  height: React.PropTypes.string,
  children: React.PropTypes.oneOfType([
    React.PropTypes.object,
    React.PropTypes.arrayOf(React.PropTypes.element),
  ]).isRequired,
};

function Wrapper(props) {
  const newChildren = React.Children.map(props.children, (child) =>
      React.cloneElement(child, { width: props.style.width, height: props.style.height })
    );
  return (
    <div {...props}>
      { newChildren }
    </div>
  );
}

Wrapper.propTypes = {
  children: React.PropTypes.oneOfType([
    React.PropTypes.object,
    React.PropTypes.arrayOf(React.PropTypes.element),
  ]).isRequired,
  style: React.PropTypes.object,
};

export class HomePage extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);

    this.state = {
      map: {
        cursorLeft: 'left',
        cursorRight: 'right',
        cursorTrackLeft: 'shift+left',
        cursorTrackRight: 'shift+right',
        cursorUp: 'up',
        cursorDown: 'down',
        notePress: [
          'z', // Cn
          'x', // Dn
          'c', // En
          'v', // Fn
          'b', // Gn
          'n', // An
          'm', // Bn
          's', // C#n
          'd', // D#n
          'g', // F#n
          'h', // G#n
          'j', // A#n
          ',', // Cn+1
          '.', // Dn+1
          '/', // En+1
          'l', // C#n+1
          ';', // D#n+1
          'q', // Cn+1
          'w', // Dn+1
          'e', // En+1
          'r', // Fn+1
          't', // Gn+1
          'y', // An+1
          'u', // Bn+1
          '2', // C#n+1
          '3', // D#n+1
          '5', // F#n+1
          '6', // G#n+1
          '7', // A#n+1
          'i', // Cn+2
          'o', // Dn+2
          'p', // En+2
          '[', // Fn+2
          ']', // Gn+2
          '9', // C#n+2
          '0', // D#n+2
          '=', // F#n+2
        ],
      },
      keyToNote: {
        z: { note: 'C', octave: 0 },
        x: { note: 'D', octave: 0 },
        c: { note: 'E', octave: 0 },
        v: { note: 'F', octave: 0 },
        b: { note: 'G', octave: 0 },
        n: { note: 'A', octave: 0 },
        m: { note: 'B', octave: 0 },
        s: { note: 'C#', octave: 0 },
        d: { note: 'D#', octave: 0 },
        g: { note: 'F#', octave: 0 },
        h: { note: 'G#', octave: 0 },
        j: { note: 'A#', octave: 0 },
        ',': { note: 'C', octave: 1 },
        '.': { note: 'D', octave: 1 },
        '/': { note: 'E', octave: 1 },
        l: { note: 'C#', octave: 1 },
        ';': { note: 'D#', octave: 1 },
        q: { note: 'C', octave: 1 },
        w: { note: 'D', octave: 1 },
        e: { note: 'E', octave: 1 },
        r: { note: 'F', octave: 1 },
        t: { note: 'G', octave: 1 },
        y: { note: 'A', octave: 1 },
        u: { note: 'B', octave: 1 },
        2: { note: 'C#', octave: 1 },
        3: { note: 'D#', octave: 1 },
        5: { note: 'F#', octave: 1 },
        6: { note: 'G#', octave: 1 },
        7: { note: 'A#', octave: 1 },
        i: { note: 'C', octave: 2 },
        o: { note: 'D', octave: 2 },
        p: { note: 'E', octave: 2 },
        '[': { note: 'F', octave: 2 },
        ']': { note: 'G', octave: 2 },
        9: { note: 'C#', octave: 2 },
        0: { note: 'D#', octave: 2 },
        '=': { note: 'F#', octave: 2 },
      },
    };

    this.onLayoutChanged = this.onLayoutChanged.bind(this);
  }

  onCursorMove(event, direction) {
    if (direction === 0) {
      this.props.onCursorLeft(this.props.song.tracks);
    } else if (direction === 1) {
      this.props.onCursorRight(this.props.song.tracks);
    } else if (direction === 2) {
      this.props.onCursorUp(1, this.props.song.patterns[0].rows);
    } else if (direction === 3) {
      this.props.onCursorDown(1, this.props.song.patterns[0].rows);
    } else if (direction === 4) {
      this.props.onCursorTrackLeft(this.props.song.tracks);
    } else if (direction === 5) {
      this.props.onCursorTrackRight(this.props.song.tracks);
    }

    event.preventDefault();
  }

  onNoteEnter(event) {
    if ((this.props.cursor.item % 6) === 0) {
      const noteMap = this.state.keyToNote[event.key];
      const note = { note: noteMap.note + (noteMap.octave + this.props.transport.octave), instrument: this.props.instrumentCursor.selected };
      this.props.onSetNoteAtCursor(this.props.cursor, note);
      this.props.onCursorDown(this.props.transport.step, this.props.song.patterns[0].rows);
    }
  }

  onLayoutChanged() {
    this.props.onForceRefresh();
  }

  render() {
    return (
      <PatternEditor
        width={800}
        height={400}
        song={this.props.song}
        pattern={this.props.song.patterns[0]}
        cursor={this.props.cursor}
        onCursorRowChange={this.props.onCursorRowChange}
        onCursorItemChange={this.props.onCursorItemChange}
        onCursorUp={this.props.onCursorUp}
        onCursorDown={this.props.onCursorDown}
        onCursorLeft={this.props.onCursorLeft}
        onCursorRight={this.props.onCursorRight}
        onCursorTrackLeft={this.props.onCursorTrackLeft}
        onCursorTrackRight={this.props.onCursorTrackRight}
        onSetNoteAtCursor={this.props.onSetNoteAtCursor}
        onDoneRefresh={this.props.onDoneRefresh}
        refresh={this.props.song.refresh}
        transport={this.props.transport}
        onSetNoteColumns={this.props.onSetNoteColumns}
      />
    );
  }
}

HomePage.propTypes = {
  cursor: React.PropTypes.object.isRequired,
  instrumentCursor: React.PropTypes.object.isRequired,
  onCursorRowChange: React.PropTypes.func.isRequired,
  onCursorItemChange: React.PropTypes.func.isRequired,
  onCursorUp: React.PropTypes.func.isRequired,
  onCursorDown: React.PropTypes.func.isRequired,
  onCursorLeft: React.PropTypes.func.isRequired,
  onCursorRight: React.PropTypes.func.isRequired,
  onSetNoteAtCursor: React.PropTypes.func.isRequired,
  song: React.PropTypes.object.isRequired,
  onCursorTrackLeft: React.PropTypes.func.isRequired,
  onCursorTrackRight: React.PropTypes.func.isRequired,
  onForceRefresh: React.PropTypes.func.isRequired,
  onDoneRefresh: React.PropTypes.func.isRequired,
  transport: React.PropTypes.object.isRequired,
  onSetNoteColumns: React.PropTypes.func.isRequired,
};

export function mapDispatchToProps(dispatch) {
  return {
    onCursorUp: (step, patternRows) => dispatch(cursorUp(step, patternRows)),
    onCursorDown: (step, patternRows) => dispatch(cursorDown(step, patternRows)),
    onCursorLeft: (tracks) => dispatch(cursorLeft(tracks)),
    onCursorRight: (tracks) => dispatch(cursorRight(tracks)),
    onCursorTrackLeft: (tracks) => dispatch(cursorTrackLeft(tracks)),
    onCursorTrackRight: (tracks) => dispatch(cursorTrackRight(tracks)),
    onCursorRowChange: (row) => dispatch(cursorSetRow(row)),
    onCursorItemChange: (track, item) => dispatch(cursorSetTrackItem(track, item)),
    onSetNoteAtCursor: (cursor, note) => dispatch(setNoteAtCursor(cursor, note)),
    onForceRefresh: () => dispatch(forceRefresh()),
    onDoneRefresh: () => dispatch(doneRefresh()),
    onSetNoteColumns: (track, count) => dispatch(setNoteColumns(track, count)),
  };
}

const mapStateToProps = createStructuredSelector({
  cursor: selectCursor(),
  song: selectSong(),
  transport: selectTransport(),
  instrumentCursor: selectInstrumentCursor(),
});

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
