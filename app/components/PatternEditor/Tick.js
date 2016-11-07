import React from 'react';

function padDigits(value, digits) {
  return Array(Math.max((digits - String(value).length) + 1, 0)).join(0) + value;
}

function rowClassNames(row, cursorLine, rowsPerBeat) {
  const names = ['row'];

  if (row % rowsPerBeat === 0) {
    names.push('beat-row');
  }

  if (row === cursorLine) {
    names.push('pattern-cursor');
  }
  return names.join(' ');
}

export default class Tick extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isCurrent: props.cursorLine === props.rownum,
      thisRow: props.rownum,
    };
  }

  shouldComponentUpdate(nextProps /* , nextState*/) {
    if ((this.props.cursorLine === this.props.rownum && nextProps.cursorLine !== nextProps.rownum) ||
        (this.props.cursorLine !== this.props.rownum && nextProps.cursorLine === nextProps.rownum)) {
      return true;
    }
    return false;
  }

  render() {
    return (
      <tr className={rowClassNames(this.props.rownum, this.props.cursorLine, 4)}>
        <th className="tick">{ padDigits(this.props.rownum, 2) }</th>
      </tr>
    );
  }
}

Tick.propTypes = {
  rownum: React.PropTypes.number.isRequired,
  cursorLine: React.PropTypes.number.isRequired,
};
