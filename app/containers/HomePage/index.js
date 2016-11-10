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

export default class HomePage extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);

    this.state = {
      currentPattern: 0,
      patternCursorRow: 0,
      patternCursorTrack: 0,
      patternCursorItem: 1,
      song: {
        tracks: [
          { name: 'Bass' },
          { name: 'Drums' },
          { name: 'Lead' },
          { name: 'Pad' },
          { name: 'Track 5' },
          { name: 'Track 6' },
        ],
        instruments: [
        ],
        patterns: [{
          rows: 64,
          trackdata: [
            [
    /* 00 */ { note: 'E4', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 01 */ {},
    /* 02 */ { note: 'D#5', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 03 */ {},
    /* 04 */ { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 05 */ {},
    /* 06 */ { note: 'D#5', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 07 */ {},
    /* 08 */ { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 09 */ {},
    /* 0A */ { note: 'B4', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 0B */ {},
    /* 0C */ { note: 'D5', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 0D */ {},
    /* 0E */ { note: 'C5', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 0F */ {},
    /* 10 */ { note: 'A2', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 11 */ {},
    /* 12 */ {},
    /* 13 */ {},
    /* 14 */ {},
    /* 15 */ {},
    /* 16 */ {},
    /* 17 */ {},
    /* 18 */ { note: 'E4', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 19 */ {},
    /* 1A */ {},
    /* 1B */ {},
    /* 1C */ { note: 'E2', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 1D */ {},
    /* 1E */ {},
    /* 1F */ {},
    /* 20 */ {},
    /* 21 */ {},
    /* 22 */ {},
    /* 23 */ {},
    /* 24 */ { note: 'G#4', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 25 */ {},
    /* 26 */ {},
    /* 27 */ {},
    /* 28 */ { note: 'A2', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 29 */ {},
    /* 2A */ {},
    /* 2B */ {},
    /* 2C */ {},
    /* 2D */ {},
    /* 2E */ {},
    /* 2F */ {},
    /* 30 */ { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 31 */ {},
    /* 32 */ { note: 'D#5', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 33 */ {},
    /* 34 */ { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 35 */ {},
    /* 36 */ { note: 'D#5', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 37 */ {},
    /* 38 */ { note: 'E5', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 39 */ {},
    /* 3A */ { note: 'B4', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 3B */ {},
    /* 3C */ { note: 'D5', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 3D */ {},
    /* 3E */ { note: 'C5', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 3F */ {},
            ],
            [
    /* 00 */ {},
    /* 01 */ {},
    /* 02 */ {},
    /* 03 */ {},
    /* 04 */ {},
    /* 05 */ {},
    /* 06 */ {},
    /* 07 */ {},
    /* 08 */ {},
    /* 09 */ {},
    /* 0A */ {},
    /* 0B */ {},
    /* 0C */ {},
    /* 0D */ {},
    /* 0E */ {},
    /* 0F */ {},
    /* 10 */ { note: 'A4', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 11 */ {},
    /* 12 */ {},
    /* 13 */ {},
    /* 14 */ { note: 'A3', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 15 */ {},
    /* 16 */ {},
    /* 17 */ {},
    /* 18 */ {},
    /* 19 */ {},
    /* 1A */ { note: 'A4', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 1B */ {},
    /* 1C */ { note: 'B4', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 1D */ {},
    /* 1E */ {},
    /* 1F */ {},
    /* 20 */ { note: 'G#3', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 21 */ {},
    /* 22 */ {},
    /* 23 */ {},
    /* 24 */ {},
    /* 25 */ {},
    /* 26 */ { note: 'B4', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 27 */ {},
    /* 28 */ { note: 'C5', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 29 */ {},
    /* 2A */ {},
    /* 2B */ {},
    /* 2C */ { note: 'A3', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 2D */ {},
    /* 2E */ {},
    /* 2F */ {},
    /* 30 */ {},
    /* 31 */ {},
    /* 32 */ {},
    /* 33 */ {},
    /* 34 */ {},
    /* 35 */ {},
    /* 36 */ {},
    /* 37 */ {},
    /* 38 */ {},
    /* 39 */ {},
    /* 3A */ {},
    /* 3B */ {},
    /* 3C */ {},
    /* 3D */ {},
    /* 3E */ {},
    /* 3F */ {},
            ],
            [
    /* 00 */ {},
    /* 01 */ {},
    /* 02 */ {},
    /* 03 */ {},
    /* 04 */ {},
    /* 05 */ {},
    /* 06 */ {},
    /* 07 */ {},
    /* 08 */ {},
    /* 09 */ {},
    /* 0A */ {},
    /* 0B */ {},
    /* 0C */ {},
    /* 0D */ {},
    /* 0E */ {},
    /* 0F */ {},
    /* 10 */ {},
    /* 11 */ {},
    /* 12 */ { note: 'E3', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 13 */ {},
    /* 14 */ {},
    /* 15 */ {},
    /* 16 */ {},
    /* 17 */ {},
    /* 18 */ {},
    /* 19 */ {},
    /* 1A */ {},
    /* 1B */ {},
    /* 1C */ { /* Stop */ },
    /* 1D */ {},
    /* 1E */ { note: 'E3', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 1F */ {},
    /* 20 */ {},
    /* 21 */ {},
    /* 22 */ {},
    /* 23 */ {},
    /* 24 */ {},
    /* 25 */ {},
    /* 26 */ {},
    /* 27 */ {},
    /* 28 */ { /* Stop */ },
    /* 29 */ {},
    /* 2A */ { note: 'E3', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 2B */ {},
    /* 2C */ {},
    /* 2D */ {},
    /* 2E */ {},
    /* 2F */ {},
    /* 30 */ {},
    /* 31 */ {},
    /* 32 */ { /* Stop */ },
    /* 33 */ {},
    /* 34 */ {},
    /* 35 */ {},
    /* 36 */ {},
    /* 37 */ {},
    /* 38 */ {},
    /* 39 */ {},
    /* 3A */ {},
    /* 3B */ {},
    /* 3C */ {},
    /* 3D */ {},
    /* 3E */ {},
    /* 3F */ {},
            ],
            [
    /* 00 */ {},
    /* 01 */ {},
    /* 02 */ {},
    /* 03 */ {},
    /* 04 */ {},
    /* 05 */ {},
    /* 06 */ {},
    /* 07 */ {},
    /* 08 */ {},
    /* 09 */ {},
    /* 0A */ {},
    /* 0B */ {},
    /* 0C */ {},
    /* 0D */ {},
    /* 0E */ {},
    /* 0F */ {},
    /* 10 */ {},
    /* 11 */ {},
    /* 12 */ {},
    /* 13 */ {},
    /* 14 */ {},
    /* 15 */ {},
    /* 16 */ { note: 'C4', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 17 */ {},
    /* 18 */ {},
    /* 19 */ {},
    /* 1A */ {},
    /* 1B */ {},
    /* 1C */ { /* Stop */ },
    /* 1D */ {},
    /* 1E */ {},
    /* 1F */ {},
    /* 20 */ {},
    /* 21 */ {},
    /* 22 */ { note: 'E4', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 23 */ {},
    /* 24 */ {},
    /* 25 */ {},
    /* 26 */ {},
    /* 27 */ {},
    /* 28 */ { /* Stop */ },
    /* 29 */ {},
    /* 2A */ {},
    /* 2B */ {},
    /* 2C */ {},
    /* 2D */ {},
    /* 2E */ { note: 'E4', instrument: 1, volume: 40, panning: 80, delay: 0 },
    /* 2F */ {},
    /* 30 */ {},
    /* 31 */ {},
    /* 32 */ { /* Stop */ },
    /* 33 */ {},
    /* 34 */ {},
    /* 35 */ {},
    /* 36 */ {},
    /* 37 */ {},
    /* 38 */ {},
    /* 39 */ {},
    /* 3A */ {},
    /* 3B */ {},
    /* 3C */ {},
    /* 3D */ {},
    /* 3E */ {},
    /* 3F */ {},
            ],
            [
    /* 00 */ {},
    /* 01 */ {},
    /* 02 */ {},
    /* 03 */ {},
    /* 04 */ {},
    /* 05 */ {},
    /* 06 */ {},
    /* 07 */ {},
    /* 08 */ {},
    /* 09 */ {},
    /* 0A */ {},
    /* 0B */ {},
    /* 0C */ {},
    /* 0D */ {},
    /* 0E */ {},
    /* 0F */ {},
    /* 10 */ {},
    /* 11 */ {},
    /* 12 */ {},
    /* 13 */ {},
    /* 14 */ {},
    /* 15 */ {},
    /* 16 */ {},
    /* 17 */ {},
    /* 18 */ {},
    /* 19 */ {},
    /* 1A */ {},
    /* 1B */ {},
    /* 1C */ {},
    /* 1D */ {},
    /* 1E */ {},
    /* 1F */ {},
    /* 20 */ {},
    /* 21 */ {},
    /* 22 */ {},
    /* 23 */ {},
    /* 24 */ {},
    /* 25 */ {},
    /* 26 */ {},
    /* 27 */ {},
    /* 28 */ {},
    /* 29 */ {},
    /* 2A */ {},
    /* 2B */ {},
    /* 2C */ {},
    /* 2D */ {},
    /* 2E */ {},
    /* 2F */ {},
    /* 30 */ {},
    /* 31 */ {},
    /* 32 */ {},
    /* 33 */ {},
    /* 34 */ {},
    /* 35 */ {},
    /* 36 */ {},
    /* 37 */ {},
    /* 38 */ {},
    /* 39 */ {},
    /* 3A */ {},
    /* 3B */ {},
    /* 3C */ {},
    /* 3D */ {},
    /* 3E */ {},
    /* 3F */ {},
            ],
            [
    /* 00 */ {},
    /* 01 */ {},
    /* 02 */ {},
    /* 03 */ {},
    /* 04 */ {},
    /* 05 */ {},
    /* 06 */ {},
    /* 07 */ {},
    /* 08 */ {},
    /* 09 */ {},
    /* 0A */ {},
    /* 0B */ {},
    /* 0C */ {},
    /* 0D */ {},
    /* 0E */ {},
    /* 0F */ {},
    /* 10 */ {},
    /* 11 */ {},
    /* 12 */ {},
    /* 13 */ {},
    /* 14 */ {},
    /* 15 */ {},
    /* 16 */ {},
    /* 17 */ {},
    /* 18 */ {},
    /* 19 */ {},
    /* 1A */ {},
    /* 1B */ {},
    /* 1C */ {},
    /* 1D */ {},
    /* 1E */ {},
    /* 1F */ {},
    /* 20 */ {},
    /* 21 */ {},
    /* 22 */ {},
    /* 23 */ {},
    /* 24 */ {},
    /* 25 */ {},
    /* 26 */ {},
    /* 27 */ {},
    /* 28 */ {},
    /* 29 */ {},
    /* 2A */ {},
    /* 2B */ {},
    /* 2C */ {},
    /* 2D */ {},
    /* 2E */ {},
    /* 2F */ {},
    /* 30 */ {},
    /* 31 */ {},
    /* 32 */ {},
    /* 33 */ {},
    /* 34 */ {},
    /* 35 */ {},
    /* 36 */ {},
    /* 37 */ {},
    /* 38 */ {},
    /* 39 */ {},
    /* 3A */ {},
    /* 3B */ {},
    /* 3C */ {},
    /* 3D */ {},
    /* 3E */ {},
    /* 3F */ {},
            ],
          ],
        }],
      },
      map: {
        cursorLeft: ['left', 'h'],
        cursorRight: ['right', 'l'],
        cursorUp: ['up', 'k'],
        cursorDown: ['down', 'j'],
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
          <div key={'transport'}><span>Transport</span></div>
          <Wrapper key={'pattern-editor'}>
            <Chrome>
              <PatternEditor
                song={this.state.song}
                cursorRow={this.state.patternCursorRow}
                cursorTrack={this.state.patternCursorTrack}
                cursorItem={this.state.patternCursorItem}
                onCursorRowChange={this.onCursorRowChange}
                onCursorItemChange={this.onCursorItemChange}
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

