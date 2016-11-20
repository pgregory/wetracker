/**
*
* Monitors
*
*/

import React from 'react';

// import { FormattedMessage } from 'react-intl';
// import messages from './messages';
import styles from './styles.css';

class Monitors extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    const columns = Math.ceil(this.props.song.tracks.length / 2.0);
    return (
      <div className={styles.monitors}>
        <div className={styles.row}>
          { this.props.song.tracks.slice(0, columns).map((track, index) => (
            <div key={index} className={styles.monitor}>{track.name}</div>
          ))}
        </div>
        <div className={styles.row}>
          { this.props.song.tracks.slice(columns).map((track, index) => (
            <div key={index} className={styles.monitor}>{track.name}</div>
          ))}
          { this.props.song.tracks.length % 2 ? <div key={this.props.song.tracks.length} className={styles.blank}></div>
                                              : ''
          }
        </div>
      </div>
    );
  }
}

Monitors.propTypes = {
  song: React.PropTypes.object.isRequired,
};

export default Monitors;
