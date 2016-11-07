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
import ReactGridLayout from 'react-grid-layout';
import PatternEditor from './pattern_editor';

import '!style!css!./styles.css';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

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
    const layout = [
      { i: 'transport', x: 0, y: 0, w: 12, h: 2, static: true },
      { i: 'pattern-editor', x: 2, y: 6, w: 8, h: 8, minW: 4, minH: 3 },
      { i: 'pattern-sequencer', x: 0, y: 6, w: 2, h: 8 },
      { i: 'instruments', x: 11, y: 3, w: 2, h: 6 },
      { i: 'monitors', x: 0, y: 2, w: 10, h: 4 },
      { i: 'browser', x: 11, y: 9, w: 2, h: 10 },
      { i: 'effects', x: 0, y: 14, w: 10, h: 4 },
    ];
    return (
      <ReactGridLayout className="layout" layout={layout} cols={12} rowHeight={30} width={1200} margin={[3, 3]}>
        <div key={'transport'}><span>Transport</span></div>
        <Wrapper key={'pattern-editor'}><PatternEditor /></Wrapper>
        <div key={'pattern-sequencer'}><div className="widget-container"><span>Pattern Sequencer</span></div></div>
        <div key={'instruments'}><div className="widget-container"><span>Instruments</span></div></div>
        <div key={'monitors'}><div className="widget-container"><span>Monitors</span></div></div>
        <div key={'browser'}><div className="widget-container"><span>Browser</span></div></div>
        <div key={'effects'}><div className="widget-container"><span>Effects</span></div></div>
      </ReactGridLayout>
    );
  }
}

