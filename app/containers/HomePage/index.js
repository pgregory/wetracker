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
      { i: 'a', x: 0, y: 0, w: 12, h: 1, static: true },
      { i: 'b', x: 2, y: 1, w: 8, h: 8, minW: 4, minH: 3 },
      { i: 'c', x: 0, y: 1, w: 2, h: 8 },
      { i: 'd', x: 11, y: 1, w: 2, h: 8 },
    ];
    return (
      <ReactGridLayout className="layout" layout={layout} cols={12} rowHeight={30} width={1200}>
        <div key={'a'}><span>a</span></div>
        <Wrapper key={'b'}><PatternEditor /></Wrapper>
        <div key={'c'}><div className="widget-container"><span>c</span></div></div>
        <div key={'d'}><div className="widget-container"><span>c</span></div></div>
      </ReactGridLayout>
    );
  }
}

