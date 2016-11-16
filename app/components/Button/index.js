/**
*
* Button
*
*/

import React from 'react';
import styles from './styles.css';
import Icon from 'react-fa';

const sizes = {
  sm: styles.sm,
};

const iconSizes = {
  sm: styles.fa,
};

class Button extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);

    this.classNames = this.classNames.bind(this);
    this.iconClassNames = this.iconClassNames.bind(this);
  }

  classNames() {
    const names = [styles.button];
    if (this.props.size) {
      names.push(sizes[this.props.size]);
    }
    return names.join(' ');
  }

  iconClassNames() {
    const names = [];
    if (this.props.size) {
      names.push(iconSizes[this.props.size]);
    }
    return names.join(' ');
  }

  render() {
    return (
      <button className={this.classNames()} onClick={this.props.callBack}>
        <Icon className={this.iconClassNames()} name={this.props.iconName} />
      </button>
    );
  }
}

Button.propTypes = {
  iconName: React.PropTypes.string,
  callBack: React.PropTypes.func,
  size: React.PropTypes.string,
};

export default Button;
