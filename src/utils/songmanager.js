import songdata from '../../data/song.json';
import cymbal from '../../data/cymbal.json';
import Signal from '../utils/signal';
import Immutable from 'immutable';

export class SongManager {
  constructor() {
    this.eventChanged = Signal.signal(false);
    this.songChanged = Signal.signal(false);

    this.newSong();
  }

  findEventAtCursor(cursor) {
    if (cursor.pattern >= this.song.patterns.length) {
      this.song.patterns[cursor.pattern] = {
        patternid: `p${this.song.patterns.length + 1}`,
        name: `Pattern ${this.song.patterns.length + 1}`,
        numrows: 32,
        rows: [] 
      };
    }
    const pattern = this.song.patterns[cursor.pattern];

    if (cursor.row >= pattern.rows.length ||
        !pattern.rows[cursor.row]) {
      pattern.rows[cursor.row] = [];
    }
    const row = pattern.rows[cursor.row];

    if (cursor.track >= row.length || row[cursor.track] == null) {
      row[cursor.track] = {
        trackindex: cursor.track,
        notedata: []
      };
    }
    const track = row[cursor.track];

    if (!("notedata" in track)) {
      track["notedata"] = [];
    }
    const events = track.notedata;

    if (cursor.column >= events.length) {
      events[cursor.column] = {};
    }
    const notecol = events[cursor.column];

    return notecol;
  }

  addNoteToSong(cursor, note, instrument = null) {
    const notecol = this.findEventAtCursor(cursor);
    notecol['note'] = note;
    if (instrument != null) {
      notecol['instrument'] = instrument;
    }
    this.eventChanged(cursor, notecol);
  }

  newSong() {
    this.song = Immutable.fromJS(songdata).toJS();
    this.song.instruments.push(Immutable.fromJS(cymbal).toJS());

    // Initialise the channelinfo for each track, temporary.
    for(var i = 0; i < this.song.tracks.length; i += 1) {
      var channelinfo = {
        number: i,
        filterstate: new Float32Array(3),
        vol: 0,
        pan: 128,
        period: 1920 - 48*16,
        vL: 0, vR: 0,   // left right volume envelope followers (changes per sample)
        vLprev: 0, vRprev: 0,
        mute: 0,
        volE: 0, panE: 0,
        retrig: 0,
        vibratopos: 0,
        vibratodepth: 1,
        vibratospeed: 1,
        vibratotype: 0,
      };
      this.song.tracks[i].channelinfo = channelinfo;
    }

    this.songChanged();
  }

  setSong(song) {
    this.song = song;

    this.songChanged();
  }
}

export let song = new SongManager(); 
