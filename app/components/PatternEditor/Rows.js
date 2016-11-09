import React from 'react';
import Row from './Row';

export default class Rows extends React.Component {
  shouldCoponentUpdate(nextProps /* , nextState*/) {
    return nextProps.cursorRow !== this.props.cursorRow;
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
            <Row
              key={row}
              pattern={this.props.song.patterns[0]}
              rownum={row}
              cursorRow={this.props.cursorRow}
              cursorTrack={this.props.cursorTrack}
              cursorItem={this.props.cursorItem}
            />
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

Rows.propTypes = {
  song: React.PropTypes.object.isRequired,
  cursorRow: React.PropTypes.number.isRequired,
  cursorTrack: React.PropTypes.number.isRequired,
  cursorItem: React.PropTypes.number.isRequired,
  topPadding: React.PropTypes.number.isRequired,
  bottomPadding: React.PropTypes.number.isRequired,
};
