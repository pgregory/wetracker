import React from 'react';

function padDigits(value, digits) {
  return Array(Math.max((digits - String(value).length) + 1, 0)).join(0) + value;
}

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

export default class Tick extends React.Component {
  shouldComponentUpdate(nextProps /* , nextState*/) {
    if ((this.props.cursorRow === this.props.rownum && nextProps.cursorRow !== nextProps.rownum) ||
        (this.props.cursorRow !== this.props.rownum && nextProps.cursorRow === nextProps.rownum)) {
      return true;
    }
    return false;
  }

  render() {
    return (
      <tr className={rowClassNames(this.props.rownum, this.props.cursorRow, 4)}>
        <th className="tick">{ padDigits(this.props.rownum, 2) }</th>
      </tr>
    );
  }
}

Tick.propTypes = {
  rownum: React.PropTypes.number.isRequired,
  cursorRow: React.PropTypes.number.isRequired,
};
