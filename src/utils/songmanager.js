import songdata from '../../data/song.json';
import Signal from '../utils/signal';

export class SongManager {
  constructor() {
    this.song = songdata;

    this.eventChanged = Signal.signal(false);
  }

  findEventAtCursor(cursor) {
    const trackid = this.song.tracks[cursor.track].id;
    const columnid = this.song.tracks[cursor.track].columns[cursor.column].id;

    if (!'p1' in this.song.patterns) {
      this.song.patterns['p1'] = {
        rows: 32,
        trackdata: {}
      };
    }
    const pattern = this.song.patterns['p1'];

    if (!(trackid in pattern.trackdata)) {
      pattern.trackdata[trackid] = {
        notedata: []
      };
    }
    const trackdata = pattern.trackdata[trackid];

    if (trackdata.notedata.length <= cursor.row ||
        !trackdata.notedata[cursor.row]) {
      trackdata.notedata[cursor.row] = {};
    }
    const notes = trackdata.notedata[cursor.row];

    if (!(columnid in notes)) {
      notes[columnid] = {};
    }
    const notecol = notes[columnid];

    return notecol;
  }

  addNoteToSong(cursor) {
    const notecol = this.findEventAtCursor(cursor);
    notecol['note'] = "G#4";
    notecol['volume'] = 40;

    this.eventChanged(cursor);
  }
}

export let song = new SongManager(); 
