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
    this.onCursorChange = this.onCursorChange.bind(this);
    this.onCursorItemChange = this.onCursorItemChange.bind(this);
    this.onCursorMove = this.onCursorMove.bind(this);

    this.yoff = 0;
  }

  componentDidUpdate() {
    const vertTarget = document.getElementById('sideTable');
    const horizTarget = document.getElementsByClassName('xscroll')[0];
    const col1 = document.getElementById('col1');

    const windowScroll = this.props.cursorRow * 15.0;

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

    this.onCursorChange(theCursor);

    horizTarget.scrollLeft += e.deltaX;

    e.preventDefault();
  }

  onCursorChange(cursor) {
    let t = cursor;
    if (t < 0) {
      t = this.props.song.patterns[0].rows - 1;
    } else if (t >= this.props.song.patterns[0].rows) {
      t = 0;
    }

    this.props.onCursorRowChange(t);
  }

  onCursorItemChange(item) {
    let i = item;
    let t = this.props.cursorTrack;
    if (i < 0) {
      i = 5;
      t -= 1;
      if (t < 0) {
        t = this.props.song.tracks.length - 1;
      }
    } else if (i > 5) {
      i = 0;
      t += 1;
      if (t >= this.props.song.tracks.length) {
        t = 0;
      }
    }

    this.props.onCursorItemChange(t, i);
  }

  onCursorMove(event, direction) {
    if (direction === 0) {
      this.onCursorItemChange(this.props.cursorItem - 1);
    } else if (direction === 1) {
      this.onCursorItemChange(this.props.cursorItem + 1);
    } else if (direction === 2) {
      this.onCursorChange(this.props.cursorRow - 1);
    } else if (direction === 3) {
      this.onCursorChange(this.props.cursorRow + 1);
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
  cursorRow: React.PropTypes.number.isRequired,
  cursorTrack: React.PropTypes.number.isRequired,
  cursorItem: React.PropTypes.number.isRequired,
  onCursorRowChange: React.PropTypes.func.isRequired,
  onCursorItemChange: React.PropTypes.func.isRequired,
  song: React.PropTypes.object.isRequired,
};

export default PatternEditor;
