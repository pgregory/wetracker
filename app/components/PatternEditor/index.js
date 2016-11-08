/**
*
* PatternEditor
*
*/

import React from 'react';
import Header from './Header';
import Timeline from './Timeline';
import Rows from './Rows';

import '!style!css!./styles.css';

class PatternEditor extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);

    this.onScroll = this.onScroll.bind(this);

    this.yoff = 0;
  }

  componentDidUpdate() {
    const vertTarget = document.getElementById('sideTable');
    const col1 = document.getElementById('col1');

    const windowScroll = this.props.cursorRow * 15.0;

    vertTarget.scrollTop = windowScroll;
    col1.scrollTop = windowScroll;
  }

  onScroll(e) {
    const vertTarget = document.getElementById('sideTable');
    const horizTarget = document.getElementsByClassName('xscroll')[0];

    this.yoff += e.deltaY;
    if (this.yoff < 0) {
      this.yoff = vertTarget.scrollHeight - vertTarget.clientHeight;
    } else if (this.yoff >= vertTarget.scrollHeight - vertTarget.clientHeight) {
      this.yoff = 0;
    }

    const theCursor = Math.round((this.yoff) / 15.0);

    this.props.onCursorChange(theCursor);

    horizTarget.scrollLeft += e.deltaX;

    e.preventDefault();
  }

  render() {
    const width = this.props.width;
    const height = this.props.height;

    /* 46 is the height of the header, need to calculate this somehow */
    const scrollHeight = (Math.floor((height - 46) / 15.0)) * 15.0;
    /* 41 is the width (including white border) of the timeline */
    const eventTableWidth = width - 41;

    const visibleLines = scrollHeight / 15;
    const blankRowsTop = Math.floor((visibleLines / 2) - 0.5);
    const blankRowsBottom = visibleLines - blankRowsTop - 1;

    return (
      <div className="pattern-editor">
        <div style={{ float: 'left' }}>
          <Timeline song={this.props.song} cursorRow={this.props.cursorRow} scrollHeight={scrollHeight} topPadding={blankRowsTop} bottomPadding={blankRowsBottom} />
        </div>

        <div style={{ float: 'left', width: eventTableWidth }} className="xscroll">
          <div id="leftSideTable">
            <Header song={this.props.song} />
          </div>
          <div style={{ height: scrollHeight }} id="sideTable" onWheel={this.onScroll}>
            <Rows 
              song={this.props.song} 
              cursorRow={this.props.cursorRow} 
              cursorTrack={this.props.cursorTrack} 
              cursorItem={this.props.cursorItem} 
              topPadding={blankRowsTop} 
              bottomPadding={blankRowsBottom} />
          </div>
        </div>
      </div>
    );
  }
}

PatternEditor.propTypes = {
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  cursorRow: React.PropTypes.number.isRequired,
  cursorTrack: React.PropTypes.number.isRequired,
  cursorItem: React.PropTypes.number.isRequired,
  onCursorChange: React.PropTypes.func.isRequired,
  song: React.PropTypes.object.isRequired,
};

export default PatternEditor;
