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
    this.props.onDoneRefresh();
  }

  onScroll(e) {
    const vertTarget = document.getElementById('sideTable');
    const horizTarget = document.getElementsByClassName('xscroll')[0];

    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      this.yoff += e.deltaY;
      if (this.yoff < 0) {
        this.yoff = vertTarget.scrollHeight - vertTarget.clientHeight;
      } else if (this.yoff >= vertTarget.scrollHeight - vertTarget.clientHeight) {
        this.yoff = 0;
      }

      const theCursor = Math.round((this.yoff) / 15.0);

      this.props.onCursorRowChange(theCursor);
    } else {
      horizTarget.scrollLeft += e.deltaX;
    }

    e.preventDefault();
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

    /* Calculate the horizontal space needed to show all visible tracks/columns */
    let totalWidth = 0;
    this.props.song.patterns[0].trackdata.forEach((track) =>
      (totalWidth += (150 * track.notecolumns)));

    return (
      <div className="pattern-editor">
        <div style={{ float: 'left' }}>
          <Timeline song={this.props.song} cursor={this.props.cursor} scrollHeight={scrollHeight} topPadding={blankRowsTop} bottomPadding={blankRowsBottom} />
        </div>

        <div style={{ float: 'left', width: eventTableWidth }} className="xscroll">
          <div id="leftSideTable" style={{ width: totalWidth }}>
            <Header song={this.props.song} />
          </div>
          <div style={{ height: scrollHeight, width: totalWidth }} id="sideTable" onWheel={this.onScroll}>
            <Rows
              song={this.props.song}
              cursor={this.props.cursor}
              topPadding={blankRowsTop}
              bottomPadding={blankRowsBottom}
              refresh={this.props.refresh}
            />
          </div>
        </div>
      </div>
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
  song: React.PropTypes.object.isRequired,
  onDoneRefresh: React.PropTypes.func.isRequired,
  refresh: React.PropTypes.bool,
};

export default PatternEditor;
