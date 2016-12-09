import songdata from '../../data/song.json';
import cymbal from '../../data/cymbal.json';
import pad from '../../data/instrument_3.json';

import Signal from '../utils/signal';
import Immutable from 'immutable';

import { xmloader } from './xmloader';

export class SongManager {
  constructor() {
    this.eventChanged = Signal.signal(false);
    this.songChanged = Signal.signal(false);

    this.eventEntries = [
      'note',
      'instrument',
      'volume',
      'fxtype',
      'fxparam',
    ];

    this.eventIndices = [
      { itemIndex: 0, mask: 0, shift: 0 },
      { itemIndex: 1, mask: 0x0F, shift: 4},
      { itemIndex: 1, mask: 0xF0, shift: 0},
      { itemIndex: 2, mask: 0x0F, shift: 4},
      { itemIndex: 2, mask: 0xF0, shift: 0},
      { itemIndex: 3, mask: 0x00, shift: 0},
      { itemIndex: 4, mask: 0x0F, shift: 4},
      { itemIndex: 4, mask: 0xF0, shift: 0},
    ];

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

  deleteItemAtCursor(cursor) {
    const notecol = this.findEventAtCursor(cursor);

    const eventItem = this.eventIndices[cursor.item].itemIndex;
    if (eventItem < this.eventEntries.length) {
      const entry = this.eventEntries[eventItem];

      switch(entry) {
        case "note":
        case "instrument":
        case "volume":
          notecol[entry] = -1;
          break;
        case "fxtype":
        case "fxparam":
          notecol["fxtype"] = 0;
          notecol["fxparam"] = 0;
          break;
        default:
          notecol[entry] = 0;
          break;
      }
      this.eventChanged(cursor, notecol);
    }
  }

  setHexValueAtCursor(cursor, value) {
    const notecol = this.findEventAtCursor(cursor);

    const eventItem = this.eventIndices[cursor.item].itemIndex;
    if (eventItem < this.eventEntries.length) {
      const entry = this.eventEntries[eventItem];
      const mask = this.eventIndices[cursor.item].mask
      const shift = this.eventIndices[cursor.item].shift
      const vald = value << shift;

      notecol[entry] = (notecol[entry] & mask) | vald;
      this.eventChanged(cursor, notecol);
    }
  }

  setFXAtCursor(cursor, value) {
    const notecol = this.findEventAtCursor(cursor);
    let vald = value;
    if(cursor.item !== 5) {
      return;
    }

    const eventItem = this.eventIndices[cursor.item].itemIndex;
    if (eventItem < this.eventEntries.length) {
      notecol.fxtype = value;
      this.eventChanged(cursor, notecol);
    }
  }

  newSong() {
    this.song = Immutable.fromJS(songdata).toJS();
    this.song.instruments.push(Immutable.fromJS(cymbal).toJS());
    this.song.instruments.push(Immutable.fromJS(pad).toJS());

    this.songChanged();
  }

  setSong(song) {
    this.song = song;

    this.songChanged();
  }

  downloadSong(uri) {
    let xmReq = new XMLHttpRequest();
    xmReq.open("GET", uri, true);
    xmReq.responseType = "arraybuffer";
    const _this = this;
    xmReq.onload = (xmEvent) => {
      const arrayBuffer = xmReq.response;
      if (arrayBuffer) {
        var newSong = xmloader.load(arrayBuffer);
        if (newSong) {
          song.setSong(newSong);
        }
      } else {
        console.log("Unable to load", uri);
      }
    };
    xmReq.send(null);
  }

  saveSongToLocal() {
    function download(text, name, type) {
      var a = document.createElement("a");
      var file = new Blob([text], {type: type});
      a.href = URL.createObjectURL(file);
      a.download = name;
      a.click();
    }
    download(JSON.stringify(this.song), this.song.name ? `${this.song.name}.json` : 'wetracker-song.json', 'text/plain');
  }

  loadSongFromFile(file, callback) {
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      var contents = e.target.result;
      try {
        var song = JSON.parse(contents);
        if (callback) {
          callback(song);
        }
      } catch(e) {
        reader.onload = function(e) {
          var contents = e.target.result;
          var song = xmloader.load(contents);
          if (callback) {
            callback(song);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    };
    reader.readAsText(file);
  }
}

export let song = new SongManager(); 
