import songdata from '../../data/song.json';
import cymbal from '../../data/cymbal.json';
import pad from '../../data/instrument_3.json';

import Signal from '../utils/signal';
import Immutable from 'immutable';

import Envelope from '../audio/envelope';
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
      0,
      1,
      1,
      2,
      2,
      3,
      3,
      4,
      4,
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

    const eventItem = this.eventIndices[cursor.item];
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
    let vald = value;
    let mask = 0xF0;
    if(cursor.item % 2 !== 0) {
      vald = vald << 4;
      mask = 0x0F;
    }

    const eventItem = this.eventIndices[cursor.item];
    if (eventItem < this.eventEntries.length) {
      const entry = this.eventEntries[eventItem];

      notecol[entry] = (notecol[entry] & mask) | vald;
      this.eventChanged(cursor, notecol);
    }
  }

  initialiseSong() {
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

    // Initialise the instruments
    for(i = 0; i < this.song.instruments.length; i += 1) {
      var inst = this.song.instruments[i];
      if (inst.env_vol) {
        inst.env_vol = new Envelope(
          inst.env_vol.points,
          inst.env_vol.type,
          inst.env_vol.sustain,
          inst.env_vol.loopstart,
          inst.env_vol.loop_end);
      }
      if (inst.env_pan) {
        inst.env_pan = new Envelope(
          inst.env_pan.points,
          inst.env_pan.type,
          inst.env_pan.sustain,
          inst.env_pan.loopstart,
          inst.env_pan.loop_end);
      }
    }
  }

  newSong() {
    this.song = Immutable.fromJS(songdata).toJS();
    this.song.instruments.push(Immutable.fromJS(cymbal).toJS());
    this.song.instruments.push(Immutable.fromJS(pad).toJS());

    this.initialiseSong();

    this.songChanged();
  }

  setSong(song) {
    this.song = song;

    this.initialiseSong();

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
