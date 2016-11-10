/**
*
* PatternEditor
*
*/

import React from 'react';
import Header from './Header';
import Timeline from './Timeline';
import Rows from './Rows';

import { HotKeys } from 'react-hotkeys';

import '!style!css!./styles.css';

class PatternEditor extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);

    this.onScroll = this.onScroll.bind(this);
    this.onCursorMove = this.onCursorMove.bind(this);

    this.yoff = 0;
  }

  componentDidUpdate() {
    const vertTarget = document.getElementById('sideTable');
    const horizTarget = document.getElementsByClassName('xscroll')[0];
    const col1 = document.getElementById('col1');

    const windowScroll = this.props.cursor.row * 15.0;

    vertTarget.scrollTop = windowScroll;
    col1.scrollTop = windowScroll;

    const item = document.getElementsByClassName('event-cursor')[0];
    let offsetParent = item.offsetParent;
    let offset = item.offsetLeft;
    while (offsetParent.parentElement.id !== 'sideTable') {
      offset += offsetParent.offsetLeft;
      offsetParent = offsetParent.offsetParent;
    }

    if ((offset + item.clientWidth) > vertTarget.parentElement.clientWidth) {
      horizTarget.scrollLeft = ((offset + item.clientWidth) - vertTarget.parentElement.clientWidth) + 6;
    } else if (offset < horizTarget.scrollLeft) {
      horizTarget.scrollLeft = offset - 6;
    }
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

    this.props.onCursorRowChange(theCursor);

    horizTarget.scrollLeft += e.deltaX;

    e.preventDefault();
  }

  onCursorMove(event, direction) {
    if (direction === 0) {
      this.props.onCursorLeft(this.props.song.tracks);
    } else if (direction === 1) {
      this.props.onCursorRight(this.props.song.tracks);
    } else if (direction === 2) {
      this.props.onCursorUp(this.props.song.patterns[0].rows);
    } else if (direction === 3) {
      this.props.onCursorDown(this.props.song.patterns[0].rows);
    }

    event.preventDefault();
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

    const handlers = {
      cursorLeft: (event) => { this.onCursorMove(event, 0); },
      cursorRight: (event) => { this.onCursorMove(event, 1); },
      cursorUp: (event) => { this.onCursorMove(event, 2); },
      cursorDown: (event) => { this.onCursorMove(event, 3); },
    };

    return (
      <HotKeys handlers={handlers} className="pattern-editor">
        <div style={{ float: 'left' }}>
          <Timeline song={this.props.song} cursor={this.props.cursor} scrollHeight={scrollHeight} topPadding={blankRowsTop} bottomPadding={blankRowsBottom} />
        </div>

        <div style={{ float: 'left', width: eventTableWidth }} className="xscroll">
          <div id="leftSideTable">
            <Header song={this.props.song} />
          </div>
          <div style={{ height: scrollHeight }} id="sideTable" onWheel={this.onScroll}>
            <Rows
              song={this.props.song}
              cursor={this.props.cursor}
              topPadding={blankRowsTop}
              bottomPadding={blankRowsBottom}
            />
          </div>
        </div>
      </HotKeys>
    );
  }
}

PatternEditor.propTypes = {
  width: React.PropTypes.number,
  height: React.PropTypes.number,
  cursor: React.PropTypes.shape({
    row: React.PropTypes.number.isRequired,
  }).isRequired,
  onCursorRowChange: React.PropTypes.func.isRequired,
  onCursorUp: React.PropTypes.func.isRequired,
  onCursorDown: React.PropTypes.func.isRequired,
  onCursorLeft: React.PropTypes.func.isRequired,
  onCursorRight: React.PropTypes.func.isRequired,
  song: React.PropTypes.object.isRequired,
};

export default PatternEditor;
