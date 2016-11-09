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

function itemClassNames(item, row, cursorRow, track, cursorTrack, itemIndex, cursorItem) {
  const names = [item];

  if (track === cursorTrack && row === cursorRow && itemIndex === cursorItem) {
    names.push('event-cursor');
  }
  return names.join(' ');
}

export default class PatternEvent extends React.Component {
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
        <div
          className={itemClassNames('note',
                                     this.props.patternRow,
                                     this.props.cursorRow,
                                     this.props.trackIndex,
                                     this.props.cursorTrack,
                                     0, this.props.cursorItem)}
        >
          { note }
        </div>
        <div
          className={itemClassNames('instrument',
                                     this.props.patternRow,
                                     this.props.cursorRow,
                                     this.props.trackIndex,
                                     this.props.cursorTrack,
                                     1, this.props.cursorItem)}
        >
          { instrument }
        </div>
        <div
          className={itemClassNames('volume',
                                     this.props.patternRow,
                                     this.props.cursorRow,
                                     this.props.trackIndex,
                                     this.props.cursorTrack,
                                     2, this.props.cursorItem)}
        >
          { volume }
        </div>
        <div
          className={itemClassNames('panning',
                                       this.props.patternRow,
                                       this.props.cursorRow,
                                       this.props.trackIndex,
                                       this.props.cursorTrack,
                                       3, this.props.cursorItem)}
        >
          { panning }
        </div>
        <div
          className={itemClassNames('delay',
                                     this.props.patternRow,
                                     this.props.cursorRow,
                                     this.props.trackIndex,
                                     this.props.cursorTrack,
                                     4, this.props.cursorItem)}
        >
          { delay }
        </div>
        <div
          className={itemClassNames('fx',
                                     this.props.patternRow,
                                     this.props.cursorRow,
                                     this.props.trackIndex,
                                     this.props.cursorTrack,
                                     5, this.props.cursorItem)}
        >
          { fx }
        </div>
      </div>
    );
  }
}


PatternEvent.propTypes = {
  event: React.PropTypes.object.isRequired,
  patternRow: React.PropTypes.number.isRequired,
  cursorRow: React.PropTypes.number.isRequired,
  cursorTrack: React.PropTypes.number.isRequired,
  trackIndex: React.PropTypes.number.isRequired,
  cursorItem: React.PropTypes.number.isRequired,
};
