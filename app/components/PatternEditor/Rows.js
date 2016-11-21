import React from 'react';
import Row from './Row';

import styles from './styles.css';

export default class Rows extends React.Component {
  shouldComponentUpdate(nextProps /* , nextState*/) {
    if (this.props.refresh) {
      return true;
    }
    if (nextProps.cursor.play_row !== this.props.cursor.play_row) {
      return true;
    }
    if (this.props.cursor.item !== nextProps.cursor.item ||
        this.props.cursor.track !== nextProps.cursor.track) {
      return true;
    }
    return nextProps.cursor.row !== this.props.cursor.row;
  }

  renderRows() {
    const rows = [];
    let row;
    for (row = 0; row < this.props.pattern.rows; row += 1) {
      rows.push(
        <Row
          key={row}
          tracks={this.props.song.tracks}
          pattern={this.props.pattern}
          rownum={row}
          cursor={this.props.cursor}
          refresh={this.props.refresh}
        />
      );
    }
    return rows;
  }

  render() {
    const rows = this.renderRows();
    return (
      <table className={styles.trackview}>
        <tbody>
          <tr>
            { this.props.pattern && this.props.pattern.trackdata.map((track, index) => (
              <td key={index}><div style={{ height: (this.props.topPadding * 15) - 2 }}></div></td>
            ))}
          </tr>
          {rows}
          <tr>
            { this.props.pattern && this.props.pattern.trackdata.map((track, index) => (
              <td key={index}><div style={{ height: (this.props.bottomPadding * 15) - 2 }}></div></td>
            ))}
          </tr>
        </tbody>
      </table>
    );
  }
}

Rows.propTypes = {
  song: React.PropTypes.object.isRequired,
  pattern: React.PropTypes.object.isRequired,
  cursor: React.PropTypes.shape({
    row: React.PropTypes.number.isRequired,
    play_row: React.PropTypes.number,
    item: React.PropTypes.number.isRequired,
    track: React.PropTypes.number.isRequired,
  }).isRequired,
  topPadding: React.PropTypes.number.isRequired,
  bottomPadding: React.PropTypes.number.isRequired,
  refresh: React.PropTypes.bool,
};
