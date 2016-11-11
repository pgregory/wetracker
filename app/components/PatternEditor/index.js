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

// t = current time
// b = start value
// c = change in value
// d = duration
function easeInOutQuad(tc, b, c, d) {
  let t = tc;
  t /= d / 2;
  if (t < 1) return (((c / 2) * t) * t) + b;
  t -= 1;
  return ((-c / 2) * ((t * (t - 2)) - 1)) + b;
}

class PatternEditor extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);

    this.onScroll = this.onScroll.bind(this);
    this.onCursorMove = this.onCursorMove.bind(this);
    this.onNoteEnter = this.onNoteEnter.bind(this);

    this.yoff = 0;
  }

  componentDidUpdate(prevProps) {
    const vertTarget = document.getElementById('sideTable');
    const horizTarget = document.getElementsByClassName('xscroll')[0];
    const col1 = document.getElementById('col1');

    const windowScroll = this.props.cursor.row * 15.0;

    vertTarget.scrollTop = windowScroll;
    col1.scrollTop = windowScroll;

    // Only check the cursor is visible if it has moved on the row.
    if (prevProps.cursor.item !== this.props.cursor.item ||
        prevProps.cursor.track !== this.props.cursor.track) {
      const item = document.getElementsByClassName('event-cursor')[0].parentElement;
      let offsetParent = item.offsetParent;
      let offset = item.offsetLeft;
      while (offsetParent.parentElement.id !== 'sideTable') {
        offset += offsetParent.offsetLeft;
        offsetParent = offsetParent.offsetParent;
      }

      if ((offset + item.clientWidth) > vertTarget.parentElement.clientWidth) {
        this.scrollHorizTo(horizTarget, ((offset + item.clientWidth) - vertTarget.parentElement.clientWidth) + 6, 100);
      } else if (offset < horizTarget.scrollLeft) {
        this.scrollHorizTo(horizTarget, offset - 6, 100);
      }
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
    this.props.onSetNoteAtCursor(this.props.cursor, event);
    this.props.onCursorDown(4, this.props.song.patterns[0].rows);
  }

  /* eslint no-param-reassign: ["error", { "props": false }]*/
  scrollHorizTo(element, to, duration) {
    const start = element.scrollLeft;
    const change = to - start;
    let currentTime = 0;
    const increment = 20;

    function animateScroll() {
      currentTime += increment;
      element.scrollLeft = easeInOutQuad(currentTime, start, change, duration);
      if (currentTime < duration) {
        setTimeout(animateScroll, increment);
      }
    }
    animateScroll();
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
      cursorTrackLeft: (event) => { this.onCursorMove(event, 4); },
      cursorTrackRight: (event) => { this.onCursorMove(event, 5); },
      cursorUp: (event) => { this.onCursorMove(event, 2); },
      cursorDown: (event) => { this.onCursorMove(event, 3); },
      notePress: (event) => { this.onNoteEnter(event); },
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
    item: React.PropTypes.number.isRequired,
    track: React.PropTypes.number.isRequired,
  }).isRequired,
  onCursorRowChange: React.PropTypes.func.isRequired,
  onCursorUp: React.PropTypes.func.isRequired,
  onCursorDown: React.PropTypes.func.isRequired,
  onCursorLeft: React.PropTypes.func.isRequired,
  onCursorRight: React.PropTypes.func.isRequired,
  onCursorTrackLeft: React.PropTypes.func.isRequired,
  onCursorTrackRight: React.PropTypes.func.isRequired,
  onSetNoteAtCursor: React.PropTypes.func.isRequired,
  song: React.PropTypes.object.isRequired,
};

export default PatternEditor;
