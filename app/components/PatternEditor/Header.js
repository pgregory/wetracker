import React from 'react';

import Button from 'components/Button';

export default class Header extends React.Component {
  onSubNoteColumn(trackIndex) {
    this.props.onSetNoteColumns(trackIndex, this.props.song.patterns[0].trackdata[trackIndex].notecolumns - 1);
  }

  onAddNoteColumn(trackIndex) {
    this.props.onSetNoteColumns(trackIndex, this.props.song.patterns[0].trackdata[trackIndex].notecolumns + 1);
  }

  render() {
    const widths = this.props.song.patterns[0].trackdata.map((track) =>
      track.notecolumns * 150);

    return (
      <table id="header-table">
        <thead>
          <tr>
            { this.props.song.tracks && this.props.song.tracks.map((track, index) => (
              <th key={index}>
                <div className="track-header" style={{ width: widths[index] }}>{track.name}
                  <div className="track-color" style={{ background: '#020' }}></div>
                  <div className="track-controls">
                    <Button callBack={() => (this.onSubNoteColumn(index))} iconName="minus" />
                    <Button callBack={() => (this.onAddNoteColumn(index))} iconName="plus" />
                  </div>
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
  onSetNoteColumns: React.PropTypes.func.isRequired,
};
