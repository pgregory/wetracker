import React from 'react';

export default class Header extends React.Component {
  shouldComponentUpdate(nextProps /* , nextState*/) {
    return (nextProps.song.tracks.length !== this.props.song.tracks.length);
  }

  render() {
    return (
      <table>
        <thead>
          <tr>
            { this.props.song.tracks && this.props.song.tracks.map((track, index) => (
              <th key={index}>
                <div className="track-header">{track.name}
                  <div className="track-color" style={{ background: '#020' }}></div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
      </table>
    );
  }
}

Header.propTypes = {
  song: React.PropTypes.object,
};
