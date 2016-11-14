/**
*
* Transport
*
*/

import React from 'react';

import styles from './styles.css';

import MusicPlayer from 'components/MusicPlayer';
import Range from 'components/Range';

import Icon from 'react-fa';


class Transport extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    return (
      <div className={styles.transport}>
        <div className={styles.item}><button onClick={this.props.onSaveSong}><Icon name="floppy-o" /></button></div>
        <div className={styles.item}><button onClick={this.props.onLoadSong}>Load</button></div>
        <div className={styles.item}><button onClick={this.props.onPlaySong}>Play</button></div>
        <div className={styles.item}><button onClick={this.props.onStopSong}>Stop</button></div>
        <div className={styles.item}><Range id={"step"} name={"Step"} min={0} max={16} value={this.props.transport.step} onChange={this.props.onStepChange} /></div>
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
