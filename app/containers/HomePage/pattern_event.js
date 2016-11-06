import React from 'react';

function padDigits(value, digits) {
  return Array(Math.max((digits - String(value).length) + 1, 0)).join(0) + value;
}

function padEventProperty(event, item, digits) {
  if (event && event[item]) {
    return padDigits(event[item], digits);
  }
  return '----------'.slice(0, digits);
}

export default class PatternEvent extends React.Component {
  shouldComponentUpdate(/* nextProps, nextState*/) {
    return false;
  }

  render() {
    let note = '---';
    const instrument = padEventProperty(this.props.event, 'instrument', 2);
    const volume = padEventProperty(this.props.event, 'volume', 2);
    const panning = padEventProperty(this.props.event, 'panning', 2);
    const delay = padEventProperty(this.props.event, 'delay', 2);
    const fx = padEventProperty(this.props.event, 'fx', 4);
    if (this.props.event) {
      if (this.props.event.note) {
        if (this.props.event.note.length === 3) {
          this.note = this.props.event.note;
        } else {
          note = [this.props.event.note.slice(0, 1), '-', this.props.event.note.slice(1)].join('');
        }
      }
    }
    return (
      <div className="line">
        <div className="note">{ note }</div>
        <div className="instrument">{ instrument }</div>
        <div className="volume">{ volume }</div>
        <div className="panning">{ panning }</div>
        <div className="delay">{ delay }</div>
        <div className="fx">{ fx }</div>
      </div>
    );
  }
}


PatternEvent.propTypes = {
  event: React.PropTypes.object,
};
