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

import React from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import PatternEditor from 'components/PatternEditor';
import InstrumentList from 'components/InstrumentList';
import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import {
  selectCursor,
  selectSong,
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
  doneRefresh,
} from 'containers/App/actions';

import { HotKeys } from 'react-hotkeys';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import '!style!css!./styles.css';

const ResponsiveReactGridLayout = WidthProvider(Responsive); /* eslint new-cap: ["error", { "capIsNew": false }] */

function Chrome(props) {
  /* Note: this relies on the border of "widget-container" being 5px */
  const innerWidth = parseInt(props.width.slice(0, -2), 10) - 10;
  const innerHeight = parseInt(props.height.slice(0, -2), 10) - 10;

  const newChildren = React.Children.map(props.children, (child) =>
      React.cloneElement(child, { width: innerWidth, height: innerHeight })
    );
  return (
    <div className="widget-container" {...props}>
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
          'a', // C
          's', // D
          'd', // E
          'f', // F
          'g', // G
          'h', // A
          'j', // B
          'k', // C
          'l', // D
          'w', // C#
          'e', // D#
          't', // F#
          'y', // G#
          'u', // A#
          'o', // C#
        ],
      },
    };

    this.onCursorRowChange = this.onCursorRowChange.bind(this);
    this.onCursorItemChange = this.onCursorItemChange.bind(this);
  }

  onCursorRowChange(row) {
    this.setState({
      patternCursorRow: row,
    });
  }

  onCursorItemChange(track, item) {
    this.setState({
      patternCursorTrack: track,
      patternCursorItem: item,
    });
  }

  render() {
    // layout is an array of objects, see the demo for more complete usage
    const layouts = {
      lg: [
        { i: 'transport', x: 0, y: 0, w: 12, h: 2, static: true },
        { i: 'pattern-editor', x: 2, y: 6, w: 8, h: 8, minW: 4, minH: 3 },
        { i: 'pattern-sequencer', x: 0, y: 6, w: 2, h: 8 },
        { i: 'instruments', x: 11, y: 3, w: 2, h: 6 },
        { i: 'monitors', x: 0, y: 2, w: 10, h: 4 },
        { i: 'browser', x: 11, y: 9, w: 2, h: 10 },
        { i: 'effects', x: 0, y: 14, w: 10, h: 4 },
      ],
      md: [
        { i: 'transport', x: 0, y: 0, w: 12, h: 2, static: true },
        { i: 'pattern-editor', x: 2, y: 6, w: 6, h: 8, minW: 4, minH: 3 },
        { i: 'pattern-sequencer', x: 0, y: 6, w: 2, h: 8 },
        { i: 'instruments', x: 11, y: 3, w: 2, h: 6 },
        { i: 'monitors', x: 0, y: 2, w: 8, h: 4 },
        { i: 'browser', x: 11, y: 9, w: 2, h: 10 },
        { i: 'effects', x: 0, y: 14, w: 8, h: 4 },
      ],
      sm: [
        { i: 'transport', x: 0, y: 0, w: 12, h: 2, static: true },
        { i: 'pattern-editor', x: 2, y: 6, w: 6, h: 8, minW: 4, minH: 3 },
        { i: 'pattern-sequencer', x: 0, y: 6, w: 2, h: 8 },
        { i: 'instruments', x: 0, y: 14, w: 2, h: 6 },
        { i: 'monitors', x: 0, y: 2, w: 8, h: 4 },
        { i: 'browser', x: 2, y: 14, w: 6, h: 6 },
        { i: 'effects', x: 0, y: 10, w: 8, h: 4 },
      ],
    };

    return (
      <HotKeys keyMap={this.state.map}>
        <ResponsiveReactGridLayout
          className="layout"
          layouts={layouts}
          rowHeight={30}
          margin={[3, 3]}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 8, xs: 4, xxs: 2 }}
        >
          <div key={'transport'}>
            <span>Transport</span>
            <button onClick={this.props.onSaveSong}>Save</button>
            <button onClick={this.props.onLoadSong}>Load</button>
          </div>
          <Wrapper key={'pattern-editor'}>
            <Chrome>
              <PatternEditor
                song={this.props.song}
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
              />
            </Chrome>
          </Wrapper>
          <div key={'pattern-sequencer'}><div className="widget-container"><span>Pattern Sequencer</span></div></div>
          <Wrapper key={'instruments'}><InstrumentList /></Wrapper>
          <div key={'monitors'}><div className="widget-container"><span>Monitors</span></div></div>
          <div key={'browser'}><div className="widget-container"><span>Browser</span></div></div>
          <div key={'effects'}><div className="widget-container"><span>Effects</span></div></div>
        </ResponsiveReactGridLayout>
      </HotKeys>
    );
  }
}

HomePage.propTypes = {
  cursor: React.PropTypes.object.isRequired,
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
  onDoneRefresh: React.PropTypes.func.isRequired,
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
    onDoneRefresh: () => dispatch(doneRefresh()),
  };
}

const mapStateToProps = createStructuredSelector({
  cursor: selectCursor(),
  song: selectSong(),
});

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
