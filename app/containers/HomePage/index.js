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

import '!style!css!./styles.css';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';


const ResponsiveReactGridLayout = WidthProvider(Responsive); /* eslint new-cap: ["error", { "capIsNew": false }] */

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
      <ResponsiveReactGridLayout
        className="layout"
        layouts={layouts}
        rowHeight={30}
        margin={[3, 3]}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 8, xs: 4, xxs: 2 }}
      >
        <div key={'transport'}><span>Transport</span></div>
        <Wrapper key={'pattern-editor'}><PatternEditor /></Wrapper>
        <div key={'pattern-sequencer'}><div className="widget-container"><span>Pattern Sequencer</span></div></div>
        <div key={'instruments'}><div className="widget-container"><span>Instruments</span></div></div>
        <div key={'monitors'}><div className="widget-container"><span>Monitors</span></div></div>
        <div key={'browser'}><div className="widget-container"><span>Browser</span></div></div>
        <div key={'effects'}><div className="widget-container"><span>Effects</span></div></div>
      </ResponsiveReactGridLayout>
    );
  }
}

