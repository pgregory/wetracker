import React from 'react';
import Event from './Event';

function rowClassNames(row, cursor, rowsPerBeat) {
  const names = ['row'];

  if (row % rowsPerBeat === 0) {
    names.push('beat-row');
  }

  if (row === cursor) {
    names.push('pattern-cursor');
  }
  return names.join(' ');
}

export default class Row extends React.Component {
  shouldComponentUpdate(nextProps /* , nextState*/) {
    if ((this.props.cursor === this.props.rownum && nextProps.cursor !== nextProps.rownum) ||
        (this.props.cursor !== this.props.rownum && nextProps.cursor === nextProps.rownum)) {
      return true;
    }
    return false;
  }

  render() {
    return (
      <tr className={rowClassNames(this.props.rownum, this.props.cursor, 4)}>
        { this.props.pattern && this.props.pattern.trackdata.map((track, index) => (
          <td key={index}><Event key={index} event={track[this.props.rownum]} /></td>
        ))}
      </tr>
    );
  }
}


Row.propTypes = {
  rownum: React.PropTypes.number.isRequired,
  cursor: React.PropTypes.number.isRequired,
  pattern: React.PropTypes.object.isRequired,
};
