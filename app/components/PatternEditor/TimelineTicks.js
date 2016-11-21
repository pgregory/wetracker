import React from 'react';
import Tick from './Tick';

import styles from './styles.css';

export default class TimelineTicks extends React.Component {
  renderTicks() {
    const ticks = [];
    let row;
    for (row = 0; row < this.props.pattern.rows; row += 1) {
      ticks.push(
        <Tick
          key={row}
          rownum={row}
          cursor={this.props.cursor}
        />
      );
    }
    return ticks;
  }


  render() {
    const ticks = this.renderTicks();
    return (
      <table>
        <tbody>
          <tr className={styles.row}><th className={styles.tick}><div style={{ height: (this.props.topPadding * 15) - 2 }}></div></th></tr>
          {ticks}
          <tr className={styles.row}><th className={styles.tick}><div style={{ height: (this.props.bottomPadding * 15) - 2 }}></div></th></tr>
        </tbody>
      </table>
    );
  }
}

TimelineTicks.propTypes = {
  cursor: React.PropTypes.shape({
    row: React.PropTypes.number.isRequired,
  }).isRequired,
  pattern: React.PropTypes.object.isRequired,
  topPadding: React.PropTypes.number.isRequired,
  bottomPadding: React.PropTypes.number.isRequired,
};
