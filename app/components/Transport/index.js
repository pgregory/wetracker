/**
*
* Transport
*
*/

import React from 'react';

import Range from 'components/Range';
import Button from 'components/Button';

import styles from './styles.css';

class Transport extends React.Component { // eslint-disable-line react/prefer-stateless-function
  shouldComponentUpdate(/* nextProps */) {
    /* We know the toolbar isn't updating normally, so just cancel here */
    return false;
  }

  render() {
    return (
      <div className={styles.transport}>
        <div className={styles.item}><Button callBack={this.props.onSaveSong} iconName="floppy-o" /></div>
        <div className={styles.item}><Button callBack={this.props.onLoadSong} iconName="file-o" /></div>
        <div className={styles.item}><Button callBack={this.props.onPlaySong} iconName="play" /></div>
        <div className={styles.item}><Button callBack={this.props.onStopSong} iconName="stop" /></div>
        <div className={styles.item}><Range id={'step'} name={'Step'} min={0} max={16} value={this.props.transport.step} onChange={this.props.onStepChange} /></div>
        <div className={styles.item}><Range id={'octave'} name={'Octave'} min={0} max={8} value={this.props.transport.octave} onChange={this.props.onOctaveChange} /></div>
      </div>
    );
  }
}

Transport.propTypes = {
  onSaveSong: React.PropTypes.func.isRequired,
  onLoadSong: React.PropTypes.func.isRequired,
  onPlaySong: React.PropTypes.func.isRequired,
  onStopSong: React.PropTypes.func.isRequired,
  transport: React.PropTypes.object.isRequired,
  onStepChange: React.PropTypes.func.isRequired,
  onOctaveChange: React.PropTypes.func.isRequired,
};

export default Transport;
