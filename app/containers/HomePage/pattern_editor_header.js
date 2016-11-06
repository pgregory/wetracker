import React from 'react';

export default class PatternEditorHeader extends React.Component {
  shouldComponentUpdate(nextProps /* , nextState*/) {
    return (nextProps.song.tracks.length !== this.props.song.tracks.length);
  }

  render() {
    return (
      <table>
        <thead>
          <tr>
            { this.props.song.tracks && this.props.song.tracks.map((track, index) => (
              <th key={index}><div className="track-header">{track.name}</div></th>
            ))}
          </tr>
        </thead>
      </table>
    );
  }
}

PatternEditorHeader.propTypes = {
  song: React.PropTypes.object,
};
