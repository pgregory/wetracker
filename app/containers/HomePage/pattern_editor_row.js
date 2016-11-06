import React from 'react';
import PatternEvent from './pattern_event';

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

export default class PatternRow extends React.Component {
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
        { this.props.pattern && this.props.pattern.trackdata.map((track, index) => (
          <td key={index}><PatternEvent key={index} event={track[this.props.rownum]} /></td>
        ))}
      </tr>
    );
  }
}


PatternRow.propTypes = {
  rownum: React.PropTypes.number.isRequired,
  cursorLine: React.PropTypes.number.isRequired,
  pattern: React.PropTypes.object.isRequired,
};
