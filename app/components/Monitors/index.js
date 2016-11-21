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
  shouldComponentUpdate(/* nextProps */) {
    return false;
  }

  render() {
    const columns = Math.ceil(this.props.tracks.length / 2.0);
    return (
      <div className={styles.monitors}>
        <div className={styles.row}>
          { this.props.tracks.slice(0, columns).map((track, index) => (
            <div key={index} className={styles.monitor}>{track.name}</div>
          ))}
        </div>
        <div className={styles.row}>
          { this.props.tracks.slice(columns).map((track, index) => (
            <div key={index} className={styles.monitor}>{track.name}</div>
          ))}
          { this.props.tracks.length % 2 ? <div key={this.props.tracks.length} className={styles.blank}></div>
                                              : ''
          }
        </div>
      </div>
    );
  }
}

Monitors.propTypes = {
  tracks: React.PropTypes.array.isRequired,
};

export default Monitors;
