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
import { Responsive, WidthProvider } from 'react-grid-layout';
import PatternEditor from 'components/PatternEditor';
import InstrumentList from 'components/InstrumentList';
import Transport from 'components/Transport';
import Monitors from 'components/Monitors';
import MusicPlayer from 'components/MusicPlayer';

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
  saveSong,
  loadSong,
  forceRefresh,
  doneRefresh,
  play,
  stop,
  playCursorSetRow,
  stepChange,
  octaveChange,
  setNoteColumns,
  selectInstrument,
  trackoutputChange,
} from 'containers/App/actions';

import { HotKeys } from 'react-hotkeys';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

/* eslint-disable import/no-webpack-loader-syntax */
import '!style!css!./styles.css';

const ResponsiveReactGridLayout = WidthProvider(Responsive); /* eslint new-cap: ["error", { "capIsNew": false }] */

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
    // layout is an array of objects, see the demo for more complete usage
    const layouts = {
      lg: [
        { i: 'transport', x: 0, y: 0, w: 12, h: 1, static: true },
        { i: 'pattern-editor', x: 2, y: 6, w: 8, h: 12, minW: 4, minH: 3 },
        { i: 'pattern-sequencer', x: 0, y: 6, w: 2, h: 12 },
        { i: 'instruments', x: 11, y: 3, w: 2, h: 8 },
        { i: 'monitors', x: 0, y: 2, w: 10, h: 4 },
        { i: 'browser', x: 11, y: 11, w: 2, h: 12 },
        { i: 'effects', x: 0, y: 14, w: 10, h: 4 },
      ],
      md: [
        { i: 'transport', x: 0, y: 0, w: 12, h: 1, static: true },
        { i: 'pattern-editor', x: 2, y: 6, w: 6, h: 8, minW: 4, minH: 3 },
        { i: 'pattern-sequencer', x: 0, y: 6, w: 2, h: 8 },
        { i: 'instruments', x: 11, y: 3, w: 2, h: 6 },
        { i: 'monitors', x: 0, y: 2, w: 8, h: 4 },
        { i: 'browser', x: 11, y: 9, w: 2, h: 10 },
        { i: 'effects', x: 0, y: 14, w: 8, h: 4 },
      ],
      sm: [
        { i: 'transport', x: 0, y: 0, w: 12, h: 1, static: true },
        { i: 'pattern-editor', x: 2, y: 6, w: 6, h: 8, minW: 4, minH: 3 },
        { i: 'pattern-sequencer', x: 0, y: 6, w: 2, h: 8 },
        { i: 'instruments', x: 0, y: 14, w: 2, h: 6 },
        { i: 'monitors', x: 0, y: 2, w: 8, h: 4 },
        { i: 'browser', x: 2, y: 14, w: 6, h: 6 },
        { i: 'effects', x: 0, y: 10, w: 8, h: 4 },
      ],
    };

    const handlers = {
      cursorLeft: (event) => { this.onCursorMove(event, 0); },
      cursorRight: (event) => { this.onCursorMove(event, 1); },
      cursorTrackLeft: (event) => { this.onCursorMove(event, 4); },
      cursorTrackRight: (event) => { this.onCursorMove(event, 5); },
      cursorUp: (event) => { this.onCursorMove(event, 2); },
      cursorDown: (event) => { this.onCursorMove(event, 3); },
      notePress: (event) => { this.onNoteEnter(event); },
    };

    return (
      <HotKeys keyMap={this.state.map} handlers={handlers}>
        <ResponsiveReactGridLayout
          className="layout"
          layouts={layouts}
          rowHeight={30}
          margin={[3, 3]}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 8, xs: 4, xxs: 2 }}
          onLayoutChange={this.onLayoutChanged}
          draggableHandle=".widget-header"
        >
          <div key={'transport'}>
            <Transport
              onSaveSong={this.props.onSaveSong}
              onLoadSong={this.props.onLoadSong}
              onPlaySong={this.props.onPlaySong}
              onStopSong={this.props.onStopSong}
              transport={this.props.transport}
              onPlayCursorRowChange={this.props.onPlayCursorRowChange}
              onStepChange={this.props.onStepChange}
              onOctaveChange={this.props.onOctaveChange}
              onTrackoutputChange={this.props.onTrackoutputChange}
            />
          </div>
          <Wrapper key={'pattern-editor'}>
            <Chrome>
              <PatternEditor
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
            </Chrome>
          </Wrapper>
          <Wrapper key={'pattern-sequencer'}>
            <Chrome>
              <span>Pattern Sequencer</span>
            </Chrome>
          </Wrapper>
          <Wrapper key={'instruments'}>
            <Chrome>
              <InstrumentList
                instruments={this.props.song.instruments}
                instrumentCursor={this.props.instrumentCursor}
                onSelectInstrument={this.props.onSelectInstrument}
              />
            </Chrome>
          </Wrapper>
          <Wrapper key={'monitors'}>
            <Chrome>
              <Monitors
                tracks={this.props.song.tracks}
              />
            </Chrome>
          </Wrapper>
          <Wrapper key={'browser'}>
            <Chrome>
              <span>Browser</span>
            </Chrome>
          </Wrapper>
          <Wrapper key={'effects'}>
            <Chrome>
              <span>Effects</span>
            </Chrome>
          </Wrapper>
        </ResponsiveReactGridLayout>
        <MusicPlayer
          song={this.props.song}
          transport={this.props.transport}
          onPlayCursorRowChange={this.props.onPlayCursorRowChange}
          onTrackoutputChange={this.props.onTrackoutputChange}
        />
      </HotKeys>
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
  onSaveSong: React.PropTypes.func.isRequired,
  onLoadSong: React.PropTypes.func.isRequired,
  onForceRefresh: React.PropTypes.func.isRequired,
  onDoneRefresh: React.PropTypes.func.isRequired,
  onPlaySong: React.PropTypes.func.isRequired,
  onStopSong: React.PropTypes.func.isRequired,
  transport: React.PropTypes.object.isRequired,
  onPlayCursorRowChange: React.PropTypes.func.isRequired,
  onStepChange: React.PropTypes.func.isRequired,
  onOctaveChange: React.PropTypes.func.isRequired,
  onSetNoteColumns: React.PropTypes.func.isRequired,
  onSelectInstrument: React.PropTypes.func.isRequired,
  onTrackoutputChange: React.PropTypes.func.isRequired,
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
    onSaveSong: () => dispatch(saveSong()),
    onLoadSong: () => dispatch(loadSong()),
    onForceRefresh: () => dispatch(forceRefresh()),
    onDoneRefresh: () => dispatch(doneRefresh()),
    onPlaySong: () => dispatch(play()),
    onStopSong: () => dispatch(stop()),
    onPlayCursorRowChange: (row) => dispatch(playCursorSetRow(row)),
    onStepChange: (step) => dispatch(stepChange(step)),
    onOctaveChange: (octave) => dispatch(octaveChange(octave)),
    onSetNoteColumns: (track, count) => dispatch(setNoteColumns(track, count)),
    onSelectInstrument: (instrument) => dispatch(selectInstrument(instrument)),
    onTrackoutputChange: (track, data) => dispatch(trackoutputChange(track, data)),
  };
}

const mapStateToProps = createStructuredSelector({
  cursor: selectCursor(),
  song: selectSong(),
  transport: selectTransport(),
  instrumentCursor: selectInstrumentCursor(),
});

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
