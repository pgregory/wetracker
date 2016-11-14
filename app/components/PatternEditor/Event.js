import React from 'react';

function padDigits(value, digits) {
  return Array(Math.max((digits - String(value).length) + 1, 0)).join(0) + value;
}

function padEventProperty(event, item, digits) {
  if (event && item in event) {
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

function EventNote(props) {
  let note = '---';
  const instrument = padEventProperty(props.event, 'instrument', 2);
  const volume = padEventProperty(props.event, 'volume', 2);
  const panning = padEventProperty(props.event, 'panning', 2);
  const delay = padEventProperty(props.event, 'delay', 2);
  const fx = padEventProperty(props.event, 'fx', 4);
  const itemIndexBase = props.noteIndex * 6;

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
    <div className="note-column">
      <div
        className={itemClassNames('note',
                                   props.cursor,
                                   props.patternRow,
                                   props.trackIndex,
                                   itemIndexBase)}
      >
        { note }
      </div>
      <div
        className={itemClassNames('instrument',
                                   props.cursor,
                                   props.patternRow,
                                   props.trackIndex,
                                   itemIndexBase + 1)}
      >
        { instrument }
      </div>
      <div
        className={itemClassNames('volume',
                                   props.cursor,
                                   props.patternRow,
                                   props.trackIndex,
                                   itemIndexBase + 2)}
      >
        { volume }
      </div>
      <div
        className={itemClassNames('panning',
                                   props.cursor,
                                   props.patternRow,
                                   props.trackIndex,
                                   itemIndexBase + 3)}
      >
        { panning }
      </div>
      <div
        className={itemClassNames('delay',
                                   props.cursor,
                                   props.patternRow,
                                   props.trackIndex,
                                   itemIndexBase + 4)}
      >
        { delay }
      </div>
      <div
        className={itemClassNames('fx',
                                   props.cursor,
                                   props.patternRow,
                                   props.trackIndex,
                                   itemIndexBase + 5)}
      >
        { fx }
      </div>
    </div>
  );
}

EventNote.propTypes = {
  event: React.PropTypes.object,
  patternRow: React.PropTypes.number.isRequired,
  cursor: React.PropTypes.object.isRequired,
  trackIndex: React.PropTypes.number.isRequired,
  noteIndex: React.PropTypes.number.isRequired,
};

export default function Event(props) {
  let notes = props.event.notes;
  if (!notes) {
    notes = Array(props.track.notecolumns).fill({});
  }
  if (notes.length < props.track.notecolumns) {
    notes = notes.concat(Array(props.track.notecolumns - notes.length).fill({}));
  }
  return (
    <div className="line">
      {notes.map((note, index) => (
        <EventNote
          key={index}
          event={note}
          cursor={props.cursor}
          patternRow={props.patternRow}
          trackIndex={props.trackIndex}
          noteIndex={index}
        />
      ))}
    </div>
  );
}


Event.propTypes = {
  event: React.PropTypes.object,
  trackIndex: React.PropTypes.number.isRequired,
  track: React.PropTypes.object.isRequired,
};
