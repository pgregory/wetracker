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
    this.initialLayout = this.initialLayout.bind(this);
    this.updateCursor = this.updateCursor.bind(this);

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
    setTimeout(this.initialLayout, 0);

    this.patternEditor = document.getElementsByClassName(styles['pattern-editor'])[0];
    this.vertTarget = document.getElementsByClassName(styles.sideTable)[0];
    this.horizTarget = document.getElementsByClassName(styles.xscroll)[0];
    this.timeline = document.getElementsByClassName(styles.timeline)[0];
    this.itemCursor = this.vertTarget.getElementsByClassName(styles['event-cursor'])[0];
    this.lastCursor = this.props.cursor;
  }

  componentWillReceiveProps(nextProps) {
    if ((this.props.height !== nextProps.height) ||
        (this.props.width !== nextProps.width)) {
      this.setState({}, this.calculateSizes);
    }
    if ((this.props.cursor.row !== nextProps.cursor.row) ||
        (this.props.cursor.item !== nextProps.cursor.item)) {
      window.requestAnimationFrame(() => this.updateCursor(nextProps.cursor));
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextState.listHeight !== this.state.listHeight ||
        nextState.headerHeight !== this.state.headerHeight ||
        nextState.tableWidth !== this.state.tableWidth) {
      return true;
    }
    return false;
  }

  componentDidUpdate() {
    this.itemCursor = this.vertTarget.getElementsByClassName(styles['event-cursor'])[0];
    this.lastCursor = this.props.cursor;
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

      const rowCursor = Math.round((this.yoff) / 15.0);
      // Render the update as quickly as the browser can...
      window.requestAnimationFrame(() => this.updateCursor(Object.assign(this.props.cursor, { row: rowCursor })));

      // ...but don't forget to tell the state about it as well.
      this.props.onCursorRowChange(rowCursor);
    } else {
      horizTarget.scrollLeft += e.deltaX;
    }
    e.preventDefault();
  }

  initialLayout() {
    this.calculateSizes();
    setTimeout(() => this.updateCursor(this.props.cursor), 500);
  }

  updateCursor(cursor) {
    const windowScroll = cursor.row * 15.0;

    this.vertTarget.scrollTop = windowScroll;
    this.timeline.scrollTop = windowScroll;

    const oldCursorRows = this.patternEditor.querySelectorAll(`tr.${styles['pattern-cursor-row']}`);
    oldCursorRows.forEach((element) => {
      element.classList.remove(styles['pattern-cursor-row']);
    });

    const timelineRow = this.patternEditor.querySelector(`.${styles.timeline} tr:nth-of-type(${cursor.row + 1})`);
    const eventsRow = this.vertTarget.querySelector(`.${styles.trackview} tr:nth-of-type(${cursor.row + 1})`);
    timelineRow.classList.add(styles['pattern-cursor-row']);
    eventsRow.classList.add(styles['pattern-cursor-row']);

    if (this.itemCursor) {
      this.itemCursor.classList.remove(styles['event-cursor']);
    }

    const newItemCursorSelector = `td:nth-of-type(${cursor.track + 1}) div.${styles['note-column']} div:nth-of-type(${cursor.item + 1})`;
    const newItemCursor = eventsRow.querySelector(newItemCursorSelector);
    if (newItemCursor) {
      newItemCursor.classList.add(styles['event-cursor']);
      this.itemCursor = newItemCursor;

      // Only check if the cursor is visible if it has moved horizontally.
      if ((this.lastCursor.track !== this.props.cursor.track) ||
          (this.lastCursor.item !== this.props.cursor.item)) {
        const item = newItemCursor.parentElement;
        let offsetParent = item.offsetParent;
        let offset = item.offsetLeft;
        while (!(offsetParent.parentElement.classList.contains(styles.sideTable))) {
          offset += offsetParent.offsetLeft;
          offsetParent = offsetParent.offsetParent;
        }

        if (((offset + item.clientWidth) - this.horizTarget.scrollLeft) > this.vertTarget.parentElement.clientWidth) {
          this.scrollHorizTo(this.horizTarget, ((offset + item.clientWidth) - this.vertTarget.parentElement.clientWidth) + 6, 100);
        } else if (offset < this.horizTarget.scrollLeft) {
          this.scrollHorizTo(this.horizTarget, offset - 6, 100);
        }
      }
    }
  }

  calculateSizes() {
    const headerHeight = document.getElementById('header-table').clientHeight;
    const scrollHeight = (Math.floor((this.props.height - headerHeight) / 15.0)) * 15.0;
    const tableWidth = document.getElementsByClassName(styles.trackview)[0].clientWidth;
    this.setState({
      listHeight: scrollHeight,
      headerHeight: headerHeight - 2,
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
