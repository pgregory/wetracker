import React from 'react';
import PatternRow from './pattern_editor_row';

export default class PatternEditorRows extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      cursorLine: props.cursorLine,
    };
  }

  shouldCoponentUpdate(nextProps /* , nextState*/) {
    return nextProps.cursorLine !== this.props.cursorLine;
  }

  render() {
    return (
      <table>
        <tbody>
          { [...Array(this.props.song.patterns[0].rows)].map((x, row) => (
            <PatternRow key={row} pattern={this.props.song.patterns[0]} rownum={row} cursorLine={this.props.cursorLine} />
          ))}
        </tbody>
      </table>
    );
  }
}

PatternEditorRows.propTypes = {
  song: React.PropTypes.object.isRequired,
  cursorLine: React.PropTypes.number.isRequired,
};
