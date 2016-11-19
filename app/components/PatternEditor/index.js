/**
*
* PatternEditor
*
*/

import React from 'react';
import Header from './Header';
import Timeline from './Timeline';
import Rows from './Rows';

import styles from './styles.css';

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
    this.calculateSizes = this.calculateSizes.bind(this);

    this.state = {
      listHeight: (Math.floor((props.height - 46) / 15.0)) * 15.0,
      headerHeight: 46,
      tableWidth: 0,
    };

    this.yoff = 0;
  }

  componentDidMount() {
    /* Need to use setTimeout to ensure that the repaint is complete and the
     * size of the table is calculated for the div "tableWidth" state param */
    setTimeout(this.calculateSizes, 0);
  }

  componentWillReceiveProps(nextProps) {
    if ((this.props.height !== nextProps.height) ||
        (this.props.width !== nextProps.width)) {
      this.setState({}, this.calculateSizes);
    }
  }

  componentDidUpdate(prevProps) {
    const vertTarget = document.getElementsByClassName(styles.sideTable)[0];
    const horizTarget = document.getElementsByClassName(styles.xscroll)[0];
    const timeline = document.getElementsByClassName(styles.timeline)[0];

    const windowScroll = this.props.cursor.row * 15.0;


    vertTarget.scrollTop = windowScroll;
    timeline.scrollTop = windowScroll;


    // Only check the cursor is visible if it has moved on the row.
    if (prevProps.cursor.item !== this.props.cursor.item ||
        prevProps.cursor.track !== this.props.cursor.track) {
      const item = document.getElementsByClassName(styles['event-cursor'])[0].parentElement;
      let offsetParent = item.offsetParent;
      let offset = item.offsetLeft;
      while (!(offsetParent.parentElement.classList.contains(styles.sideTable))) {
        offset += offsetParent.offsetLeft;
        offsetParent = offsetParent.offsetParent;
      }

      if (((offset + item.clientWidth) - horizTarget.scrollLeft) > vertTarget.parentElement.clientWidth) {
        this.scrollHorizTo(horizTarget, ((offset + item.clientWidth) - vertTarget.parentElement.clientWidth) + 6, 100);
      } else if (offset < horizTarget.scrollLeft) {
        this.scrollHorizTo(horizTarget, offset - 6, 100);
      }
    }
    this.props.onDoneRefresh();
  }

  onScroll(e) {
    const vertTarget = document.getElementsByClassName(styles.sideTable)[0];
    const horizTarget = document.getElementsByClassName(styles.xscroll)[0];

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

  calculateSizes() {
    const headerHeight = document.getElementById('header-table').clientHeight;
    const scrollHeight = (Math.floor((this.props.height - headerHeight) / 15.0)) * 15.0;
    const tableWidth = document.getElementsByClassName(styles.trackview)[0].clientWidth;
    this.setState({
      listHeight: scrollHeight,
      headerHeight: headerHeight - 1,
      tableWidth: tableWidth + 1,
    });
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
    const eventTableWidth = width - 41;

    const visibleLines = this.state.listHeight / 15;
    const blankRowsTop = Math.floor((visibleLines / 2) - 0.5);
    const blankRowsBottom = visibleLines - blankRowsTop - 1;

    /* Calculate the horizontal space needed to show all visible tracks/columns */
    let totalWidth = 0;
    this.props.pattern.trackdata.forEach((track) =>
      (totalWidth += (150 * track.notecolumns)));
    return (
      <div className={styles['pattern-editor']}>
        <div style={{ float: 'left' }}>
          <Timeline
            pattern={this.props.pattern}
            cursor={this.props.cursor}
            scrollHeight={this.state.listHeight}
            topPadding={blankRowsTop}
            bottomPadding={blankRowsBottom}
            headerHeight={this.state.headerHeight}
          />
        </div>

        <div style={{ float: 'left', width: eventTableWidth }} className={styles.xscroll}>
          <div className={styles.leftSideTable} style={{ width: this.state.tableWidth }}>
            <Header
              song={this.props.song}
              onSetNoteColumns={this.props.onSetNoteColumns}
            />
          </div>
          <div style={{ height: this.state.listHeight, width: this.state.tableWidth }} className={styles.sideTable} onWheel={this.onScroll}>
            <Rows
              song={this.props.song}
              pattern={this.props.pattern}
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
  pattern: React.PropTypes.object.isRequired,
  onDoneRefresh: React.PropTypes.func.isRequired,
  refresh: React.PropTypes.bool,
  onSetNoteColumns: React.PropTypes.func.isRequired,
};

export default PatternEditor;
