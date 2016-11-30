import songdata from '../../data/song.json';
import Signal from '../utils/signal';

export class SongManager {
  constructor() {
    this.song = songdata;

    this.eventChanged = Signal.signal(false);
  }

  findEventAtCursor(cursor) {
    if (!cursor.pattern in this.song.patterns) {
      this.song.patterns[cursor.pattern] = {
        rows: 32,
        trackdata: {}
      };
    }
    const pattern = this.song.patterns[cursor.pattern];

    if (pattern.rows.length <= cursor.row ||
        !pattern.rows[cursor.row]) {
      pattern.rows[cursor.row] = {};
    }
    const row = pattern.rows[cursor.row];

    const trackid = this.song.tracks[cursor.track].id;
    if (!(trackid in row)) {
      row[trackid] = {
        notedata: {}
      };
    }
    const track = row[trackid];
    const events = track.notedata;

    const columnid = this.song.tracks[cursor.track].columns[cursor.column].id;
    if (!(columnid in events)) {
      events[columnid] = {};
    }
    const notecol = events[columnid];

    return notecol;
  }

  addNoteToSong(cursor) {
    const notecol = this.findEventAtCursor(cursor);
    notecol['note'] = 0;
    notecol['volume'] = 0x40;

    this.eventChanged(cursor);
  }
}

export let song = new SongManager(); 
