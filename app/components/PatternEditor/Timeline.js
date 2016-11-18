import React from 'react';
import Tick from './Tick';

import styles from './styles.css';

export default class Timeline extends React.Component {
  shouldComponentUpdate(nextProps /* , nextState*/) {
    return ((nextProps.cursor.row !== this.props.cursor.row) ||
            (nextProps.headerHeight !== this.props.headerHeight));
  }

  render() {
    return (
      <div>
        <div>
          <table id="timeline-header">
            <thead>
              <tr className={styles.row}>
                <th className={styles.tick}><div className={styles['time-header']} style={{ height: this.props.headerHeight }}><br /></div></th>
              </tr>
            </thead>
          </table>
        </div>

        <div className={styles.timeline} style={{ height: this.props.scrollHeight }}>
          <table>
            <tbody>
              <tr className={styles.row}><th className={styles.tick}><div style={{ height: (this.props.topPadding * 15) - 2 }}></div></th></tr>
              { [...Array(this.props.pattern.rows)].map((x, row) => (
                <Tick key={row} rownum={row} cursor={this.props.cursor} />
              ))}
              <tr className={styles.row}><th className={styles.tick}><div style={{ height: (this.props.bottomPadding * 15) - 2 }}></div></th></tr>
            </tbody>
          </table>
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
