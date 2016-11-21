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
  shouldComponentUpdate(/* nextProps */) {
    return false;
  }

  render() {
    return (
      <div className={styles.instrumentList}>
        <div>
          { this.props.instruments.map((instrument, index) => (
            <div key={index}>
              <span className={styles.instrumentNumber}>{index}</span>
              <button
                onClick={() => this.props.onSelectInstrument(index)}
                className={classNames(this.props.instrumentCursor.selected, index)}
              >
                { instrument.name }
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

InstrumentList.propTypes = {
  instruments: React.PropTypes.array.isRequired,
  instrumentCursor: React.PropTypes.object.isRequired,
  onSelectInstrument: React.PropTypes.func.isRequired,
};

export default InstrumentList;
