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

function itemClassNames(item, cursor, row, track, itemIndex) {
  const names = [item];

  if (track === cursor.track && row === cursor.row && itemIndex === cursor.item) {
    names.push('event-cursor');
  }
  return names.join(' ');
}

export default function Event(props) {
  let note = '---';
  const instrument = padEventProperty(props.event, 'instrument', 2);
  const volume = padEventProperty(props.event, 'volume', 2);
  const panning = padEventProperty(props.event, 'panning', 2);
  const delay = padEventProperty(props.event, 'delay', 2);
  const fx = padEventProperty(props.event, 'fx', 4);
  if (props.event) {
    if (props.event.note) {
      if (props.event.note.length === 3) {
        note = props.event.note;
      } else {
        note = [props.event.note.slice(0, 1), '-', props.event.note.slice(1)].join('');
      }
    }
  }
  return (
    <div className="line">
      <div
        className={itemClassNames('note',
                                   props.cursor,
                                   props.patternRow,
                                   props.trackIndex,
                                   0)}
      >
        { note }
      </div>
      <div
        className={itemClassNames('instrument',
                                   props.cursor,
                                   props.patternRow,
                                   props.trackIndex,
                                   1)}
      >
        { instrument }
      </div>
      <div
        className={itemClassNames('volume',
                                   props.cursor,
                                   props.patternRow,
                                   props.trackIndex,
                                   2)}
      >
        { volume }
      </div>
      <div
        className={itemClassNames('panning',
                                     props.cursor,
                                     props.patternRow,
                                     props.trackIndex,
                                     3)}
      >
        { panning }
      </div>
      <div
        className={itemClassNames('delay',
                                   props.cursor,
                                   props.patternRow,
                                   props.trackIndex,
                                   4)}
      >
        { delay }
      </div>
      <div
        className={itemClassNames('fx',
                                   props.cursor,
                                   props.patternRow,
                                   props.trackIndex,
                                   5)}
      >
        { fx }
      </div>
    </div>
  );
}


Event.propTypes = {
  event: React.PropTypes.object.isRequired,
  patternRow: React.PropTypes.number.isRequired,
  cursor: React.PropTypes.object.isRequired,
  trackIndex: React.PropTypes.number.isRequired,
};
