import React from 'react';
import Event from './Event';

function rowClassNames(row, cursor, rowsPerBeat) {
  const names = ['row'];

  if (row % rowsPerBeat === 0) {
    names.push('beat-row');
  }

  if (row === cursor) {
    names.push('pattern-cursor-row');
  }
  return names.join(' ');
}

export default class Row extends React.Component {
  shouldComponentUpdate(nextProps /* , nextState*/) {
    if ((this.props.cursor.row === this.props.rownum && nextProps.cursor.row !== nextProps.rownum) ||
        (this.props.cursor.row !== this.props.rownum && nextProps.cursor.row === nextProps.rownum)) {
      return true;
    }
    if (this.props.cursor.row === this.props.rownum &&
         (this.props.cursor.item !== nextProps.cursor.item)) {
      return true;
    }
    return false;
  }

  render() {
    return (
      <tr className={rowClassNames(this.props.rownum, this.props.cursor.row, 4)}>
        { this.props.pattern && this.props.pattern.trackdata.map((track, index) => (
          <td key={index}>
            <Event
              key={index}
              patternRow={this.props.rownum}
              cursor={this.props.cursor}
              event={track[this.props.rownum]}
              trackIndex={index}
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
    item: React.PropTypes.number.isRequired,
  }).isRequired,
  pattern: React.PropTypes.object.isRequired,
};
