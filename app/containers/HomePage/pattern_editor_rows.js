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
          <tr>
            { this.props.song.patterns[0] && this.props.song.patterns[0].trackdata.map((track, index) => (
              <td key={index}><div style={{ height: (this.props.topPadding * 15) - 2 }}></div></td>
            ))}
          </tr>
          { [...Array(this.props.song.patterns[0].rows)].map((x, row) => (
            <PatternRow key={row} pattern={this.props.song.patterns[0]} rownum={row} cursorLine={this.props.cursorLine} />
          ))}
          <tr>
            { this.props.song.patterns[0] && this.props.song.patterns[0].trackdata.map((track, index) => (
              <td key={index}><div style={{ height: (this.props.bottomPadding * 15) - 2 }}></div></td>
            ))}
          </tr>
        </tbody>
      </table>
    );
  }
}

PatternEditorRows.propTypes = {
  song: React.PropTypes.object.isRequired,
  cursorLine: React.PropTypes.number.isRequired,
  topPadding: React.PropTypes.number.isRequired,
  bottomPadding: React.PropTypes.number.isRequired,
};
