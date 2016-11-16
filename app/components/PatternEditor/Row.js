import React from 'react';
import Event from './Event';

import styles from './styles.css';

function rowClassNames(row, cursor, rowsPerBeat) {
  const names = [styles.row];

  if (row % rowsPerBeat === 0) {
    names.push(styles['beat-row']);
  }

  if (row === cursor.row) {
    names.push(styles['pattern-cursor-row']);
  }

  if (row === cursor.play_row) {
    names.push(styles['pattern-play-cursor-row']);
  }
  return names.join(' ');
}

export default class Row extends React.Component {
  shouldComponentUpdate(nextProps /* , nextState*/) {
    if (this.props.refresh) {
      return true;
    }
    if ((this.props.cursor.row === this.props.rownum && nextProps.cursor.row !== nextProps.rownum) ||
        (this.props.cursor.row !== this.props.rownum && nextProps.cursor.row === nextProps.rownum)) {
      return true;
    }
    if ((this.props.cursor.play_row === this.props.rownum && nextProps.cursor.play_row !== nextProps.rownum) ||
        (this.props.cursor.play_row !== this.props.rownum && nextProps.cursor.play_row === nextProps.rownum)) {
      return true;
    }
    if (this.props.cursor.row === this.props.rownum &&
       (this.props.cursor.item !== nextProps.cursor.item ||
        this.props.cursor.track !== nextProps.cursor.track)) {
      return true;
    }
    return false;
  }

  render() {
    return (
      <tr className={rowClassNames(this.props.rownum, this.props.cursor, 4)}>
        { this.props.pattern && this.props.pattern.trackdata.map((track, index) => (
          <td key={index}>
            <Event
              key={index}
              patternRow={this.props.rownum}
              cursor={this.props.cursor}
              event={track.notedata[this.props.rownum]}
              trackIndex={index}
              track={track}
            />
          </td>
        ))}
      </tr>
    );
  }
}


Row.propTypes = {
  rownum: React.PropTypes.number.isRequired,
  cursor: React.PropTypes.shape({
    row: React.PropTypes.number.isRequired,
    play_row: React.PropTypes.number.isRequired,
    item: React.PropTypes.number.isRequired,
    track: React.PropTypes.number.isRequired,
  }).isRequired,
  pattern: React.PropTypes.object.isRequired,
  refresh: React.PropTypes.bool,
};
