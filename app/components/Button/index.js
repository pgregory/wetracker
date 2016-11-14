/**
*
* Button
*
*/

import React from 'react';
import styles from './styles.css';
import Icon from 'react-fa';

class Button extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    return (
      <button className={styles.button} onClick={this.props.callBack}>
        <Icon name={this.props.iconName} />
      </button>
    );
  }
}

Button.propTypes = {
  iconName: React.PropTypes.string,
  callBack: React.PropTypes.func,
};

export default Button;
