import React from 'react';
import TimelineHeader from './TimelineHeader';
import TimelineTicks from './TimelineTicks';

import styles from './styles.css';

/* eslint-disable react/prefer-stateless-function */
export default class Timeline extends React.Component {
  render() {
    return (
      <div>
        <div>
          <TimelineHeader
            headerHeight={this.props.headerHeight}
          />
        </div>

        <div className={styles.timeline} style={{ height: this.props.scrollHeight }}>
          <TimelineTicks
            cursor={this.props.cursor}
            pattern={this.props.pattern}
            bottomPadding={this.props.bottomPadding}
            topPadding={this.props.topPadding}
          />
        </div>
      </div>
    );
  }
}

Timeline.propTypes = {
  cursor: React.PropTypes.shape({
    row: React.PropTypes.number.isRequired,
  }).isRequired,
  scrollHeight: React.PropTypes.number.isRequired,
  headerHeight: React.PropTypes.number.isRequired,
  pattern: React.PropTypes.object.isRequired,
  topPadding: React.PropTypes.number.isRequired,
  bottomPadding: React.PropTypes.number.isRequired,
};
