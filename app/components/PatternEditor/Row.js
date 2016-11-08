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
    if ((this.props.cursorRow === this.props.rownum && nextProps.cursorRow !== nextProps.rownum) ||
        (this.props.cursorRow !== this.props.rownum && nextProps.cursorRow === nextProps.rownum)) {
      return true;
    }
    if (this.props.cursorRow === this.props.rownum && 
         (this.props.cursorItem !== nextProps.cursorItem)) {
      return true;
    }
    return false;
  }

  render() {
    return (
      <tr className={rowClassNames(this.props.rownum, this.props.cursorRow, 4)}>
        { this.props.pattern && this.props.pattern.trackdata.map((track, index) => (
          <td key={index}>
            <Event 
              key={index} 
              patternRow={this.props.rownum}
              cursorRow={this.props.cursorRow}
              event={track[this.props.rownum]} 
              trackIndex={index} 
              cursorTrack={this.props.cursorTrack}
              cursorItem={this.props.cursorItem} />
          </td>
        ))}
      </tr>
    );
  }
}


Row.propTypes = {
  rownum: React.PropTypes.number.isRequired,
  cursorRow: React.PropTypes.number.isRequired,
  cursorTrack: React.PropTypes.number.isRequired,
  pattern: React.PropTypes.object.isRequired,
  cursorItem: React.PropTypes.number.isRequired,
};
