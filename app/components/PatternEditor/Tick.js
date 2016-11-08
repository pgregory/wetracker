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
    names.push('pattern-cursor');
  }
  return names.join(' ');
}

export default class Tick extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isCurrent: props.cursor === props.rownum,
      thisRow: props.rownum,
    };
  }

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
        <th className="tick">{ padDigits(this.props.rownum, 2) }</th>
      </tr>
    );
  }
}

Tick.propTypes = {
  rownum: React.PropTypes.number.isRequired,
  cursor: React.PropTypes.number.isRequired,
};
