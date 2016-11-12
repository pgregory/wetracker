import React from 'react';
import Row from './Row';

export default class Rows extends React.Component {
  shouldCoponentUpdate(nextProps /* , nextState*/) {
    if (this.props.refresh) {
      return true;
    }
    return nextProps.cursor.row !== this.props.cursor.row;
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
              cursor={this.props.cursor}
              refresh={this.props.refresh}
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
  cursor: React.PropTypes.shape({
    row: React.PropTypes.number.isRequired,
  }).isRequired,
  topPadding: React.PropTypes.number.isRequired,
  bottomPadding: React.PropTypes.number.isRequired,
  refresh: React.PropTypes.bool,
};
