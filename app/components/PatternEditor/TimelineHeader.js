import React from 'react';

import styles from './styles.css';

/* eslint-disable react/prefer-stateless-function */
export default class TimelineHeader extends React.Component {
  render() {
    return (
      <table id="timeline-header">
        <thead>
          <tr className={styles.row}>
            <th className={styles.tick}><div className={styles['time-header']} style={{ height: this.props.headerHeight }}><br /></div></th>
          </tr>
        </thead>
      </table>
    );
  }
}

TimelineHeader.propTypes = {
  headerHeight: React.PropTypes.number.isRequired,
};
