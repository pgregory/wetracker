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
import { FormattedMessage } from 'react-intl';
import messages from './messages';
import ReactGridLayout from 'react-grid-layout';
import PatternEditor from './pattern_editor';

import '!style!css!./styles.css';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

var Wrapper = React.createClass({
  render: function () {
    var that = this;

    var newChildren = React.Children.map(this.props.children, function(child) {
        return React.cloneElement(child, { width: that.props.style.width,
        height: that.props.style.height})
        });
    return (
      <div {...this.props}>
          { newChildren }
      </div>
    );
  }
});

export default class HomePage extends React.Component { // eslint-disable-line react/prefer-stateless-function

  render() {
    // layout is an array of objects, see the demo for more complete usage
    var layout = [
      {i: 'a', x: 0, y: 0, w: 1, h: 2},
      {i: 'b', x: 1, y: 0, w: 6, h: 6, minW: 4},
      {i: 'c', x: 7, y: 0, w: 1, h: 2}
    ];
    return (
      <ReactGridLayout className="layout" layout={layout} cols={12} rowHeight={30} width={1200}>
        <div key={'a'}><div className="widget-container"><span>a</span></div></div>
        <Wrapper key={'b'}><PatternEditor/></Wrapper>
        <div key={'c'}><div className="widget-container"><span>c</span></div></div>
      </ReactGridLayout>
    );
  }
}

