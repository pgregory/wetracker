/**
*
* Transport
*
*/

import React from 'react';

import styles from './styles.css';

import MusicPlayer from 'components/MusicPlayer';
import Range from 'components/Range';

class Transport extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    return (
      <div className={styles.transport}>
        <button onClick={this.props.onSaveSong}>Save</button>
        <button onClick={this.props.onLoadSong}>Load</button>
        <button onClick={this.props.onPlaySong}>Play</button>
        <button onClick={this.props.onStopSong}>Stop</button>
        <Range id={"step"} name={"Step"} min={0} max={16} value={this.props.transport.step} onChange={this.props.onStepChange} />
        <MusicPlayer
          song={this.props.song}
          transport={this.props.transport}
          onPlayCursorRowChange={this.props.onPlayCursorRowChange}
        />
      </div>
    );
  }
}

Transport.propTypes = {
  onSaveSong: React.PropTypes.func.isRequired,
  onLoadSong: React.PropTypes.func.isRequired,
  onPlaySong: React.PropTypes.func.isRequired,
  onStopSong: React.PropTypes.func.isRequired,
  onPlayCursorRowChange: React.PropTypes.func.isRequired,
  transport: React.PropTypes.object.isRequired,
  song: React.PropTypes.object.isRequired,
  onStepChange: React.PropTypes.func.isRequired,
};

export default Transport;
