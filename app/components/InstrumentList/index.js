/**
*
* InstrumentList
*
*/

import React from 'react';

import styles from './styles.css';

function classNames(cursor, index) {
  const names = [];

  if (cursor === index) {
    names.push(styles.selected);
  }
  return names.join(' ');
}

class InstrumentList extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    return (
      <div className={styles.instrumentList}>
        <div>
          <ol>
            { this.props.song.instruments.map((instrument, index) => (
              <li key={index} className={classNames(0, index)}>{ instrument.name }</li>
            ))}
          </ol>
        </div>
      </div>
    );
  }
}

InstrumentList.propTypes = {
  song: React.PropTypes.object.isRequired,
};

export default InstrumentList;
