import $ from 'jquery';

import songdata from '../../data/song.json';
import cymbal from '../../data/cymbal.json';
import pad from '../../data/instrument_3.json';

import {encode, decode} from 'base64-arraybuffer';

import Signal from '../utils/signal';
import Immutable from 'immutable';

import { xmloader } from './xmloader';
import { state } from '../state';

export class SongManager {
  constructor() {
    this.eventChanged = Signal.signal(false);
    this.songChanged = Signal.signal(false);
    this.instrumentChanged = Signal.signal(false);
    this.sampleChanged = Signal.signal(false);
    this.instrumentListChanged = Signal.signal(false);
    this.bpmChanged = Signal.signal(false);
    this.speedChanged = Signal.signal(false);
    this.sequenceChanged = Signal.signal(false);
    this.trackChanged = Signal.signal(false);

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

    state.set({
      transport: {
        bpm: this.song.bpm,
        speed: this.song.speed,
      },
    });

    this.songChanged();
  }

  addInstrument() {
    const samplemap = new Uint8Array(96);
    this.song.instruments.push({
      'name': `Instrument ${this.song.instruments.length}`,
      'number': this.song.instruments.length,
      'samples': [],
      samplemap,
    });
    this.instrumentListChanged();
    state.set({
      cursor: {
        instrument: this.song.instruments.length - 1,
      }
    });
  }

  addSampleToInstrument(instrumentIndex) {
    try {
      this.song.instruments[instrumentIndex].samples.push({
        'len': 0, 
        'loop': 0,
        'looplen': 0, 
        'note': 0, 
        'fine': 0,
        'pan': 0, 
        'type': 0, 
        'vol': 0x40,
        'fileoffset': 0, 
        'name': `Sample ${this.song.instruments[instrumentIndex].samples.length}`,
      });
      this.instrumentChanged(instrumentIndex);
      state.set({
        cursor: {
          sample: this.song.instruments[instrumentIndex].samples.length - 1,
        }
      });
    } catch(e) {
      console.log(e);
    }
  }

  addPattern(sequence) {
    this.song.patterns.push({
      patternid: this.song.patterns.length,
      name: `Pattern ${this.song.patterns.length}`,
      numrows: 32,
      rows: [],
    });
    let pos = sequence + 1;
    if(!sequence || sequence > this.song.sequence.length) {
      pos = this.song.sequence.length;
    }
    this.song.sequence.splice(pos, 
                              0, 
                              {
                                pattern: this.song.patterns.length - 1,
                              });
    this.songChanged();
    state.set({
      cursor: {
        sequence: pos,
        pattern: this.song.sequence[pos].pattern,
      }
    });
  }

  deletePattern(sequence) {
    let pos = sequence - 1;
    if (pos < 0) {
      pos = 0;
    }
    this.song.sequence.splice(sequence, 1, );
    this.songChanged();
    state.set({
      cursor: {
        sequence: pos,
        pattern: this.song.sequence[pos].pattern,
      }
    });
  }

  clonePattern(sequence) {
    const donor = this.song.patterns[this.song.sequence[sequence].pattern];
    const newPattern = $.extend(true, {}, donor);
    newPattern.patternid = this.song.patterns.length;
    newPattern.name = `Pattern ${this.song.patterns.length}`;
    console.log(newPattern);
    this.song.patterns.push(newPattern);
    let pos = sequence + 1;
    if(!sequence || sequence > this.song.sequence.length) {
      pos = this.song.sequence.length;
    }
    this.song.sequence.splice(pos, 
                              0, 
                              {
                                pattern: this.song.patterns.length - 1,
                              });
    this.songChanged();
    state.set({
      cursor: {
        sequence: pos,
        pattern: this.song.sequence[pos].pattern,
      }
    });
  }

  duplicatePattern(sequence) {
    let pos = sequence + 1;
    if(!sequence || sequence > this.song.sequence.length) {
      pos = this.song.sequence.length;
    }
    this.song.sequence.splice(pos, 
                              0, 
                              {
                                pattern: this.song.sequence[sequence].pattern,
                              });
    this.songChanged();
    state.set({
      cursor: {
        sequence: pos,
        pattern: this.song.sequence[pos].pattern,
      }
    });
  }

  updateSequencePattern(sequence, increment) {
    const val = this.song.sequence[sequence].pattern + increment;
    if (val >= 0 && val >= this.song.patterns.length) {
      this.song.patterns.push({
        patternid: this.song.patterns.length,
        name: `Pattern ${this.song.patterns.length}`,
        numrows: 32,
        rows: [],
      });
    }
    if (val >= 0) {
      this.song.sequence[sequence].pattern = val;
      this.sequenceChanged(sequence);

      const pattern = this.song.sequence[sequence].pattern;
      state.set({
        cursor: {
          pattern,
        },
      });
    }
  }

  setSong(song) {
    this.song = song;
    state.set({
      cursor: {
        pattern: 0,
        sequence: 0,
        instrument: 0,
        sample: 0,
        row: 0,
        item: 0,
        track: 0,
        column: 0,
        record: false,
      }
    });

    state.set({
      transport: {
        bpm: this.song.bpm,
        speed: this.song.speed,
      },
    });

    this.songChanged();
  }

  downloadSong(uri) {
    var promise = new Promise(function(resolve, reject) {
      let xmReq = new XMLHttpRequest();
      xmReq.open("GET", uri, true);
      xmReq.responseType = "arraybuffer";
      const _this = this;
      xmReq.onload = (xmEvent) => {
        const arrayBuffer = xmReq.response;
        if (arrayBuffer) {
          // Remove anchor
          let filename = uri.substring(0, (uri.indexOf("#") == -1) ? uri.length : uri.indexOf("#"));
          // Remove query
          filename = filename.substring(0, (filename.indexOf("?") == -1) ? filename.length : filename.indexOf("?"));
          // Remove everything prior to final name
          filename = filename.substring(filename.lastIndexOf("/") + 1, filename.length);
          var newSong = xmloader.load(arrayBuffer, filename);
          if (newSong) {
            song.setSong(newSong);
            resolve();
          }
        } else {
          console.log("Unable to load", uri);
          reject();
        }
      };
      xmReq.send(null);
    });
    return promise;
  }

  saveSongToLocal() {
    function download(text, name, type) {
      var a = document.createElement("a");
      var file = new Blob([text], {type: type});
      a.href = URL.createObjectURL(file);
      a.download = name;
      a.click();
    }
    download(JSON.stringify(this.song, (k, v) => {
      // Deal with sampledata differently, as we encode the binary data for
      // efficient serialisation.
      if (k === 'sampledata') {
        return Object.assign(v, {
            data: encode(v.data.buffer),
            serialiseEncoding: 'base64',
          });
      } else {
        return v
      }
    }, ' '), this.song.name ? `${this.song.name}.json` : 'wetracker-song.json', 'text/plain');
  }

  loadSongFromFile(file, callback) {
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      var contents = e.target.result;
      try {
        var song = JSON.parse(contents, (k, v) => {
          // Deal with sample data differently, as we encode for efficient
          // serialisation of large binary data.
          if (k === 'sampledata') {
            // If the file version has serialisation encoding information, use it.
            if ('serialiseEncoding' in v) {
              // Base64 encoding.
              if ( v.serialiseEncoding === 'base64') {
                const sampledata = new Float32Array(decode(v.data));
                return Object.assign(v, {
                  data: sampledata,
                });
              } else {
                // Unknown encoding, return raw.
                return v;
              }
            } else {
              // Presume raw Float32Array old format
              return {
                data: v,
              }; 
            }
          } else {
            return v
          }
        });
        if (callback) {
          callback(song);
        }
      } catch(e) {
        reader.onload = function(e) {
          var contents = e.target.result;
          var song = xmloader.load(contents, file.name);
          if (callback) {
            callback(song);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    };
    reader.readAsText(file);
  }

  setInstrumentName(instrumentIndex, name) {
    try {
      const instrument = this.song.instruments[instrumentIndex];
      instrument.name = name;
      this.instrumentChanged(instrumentIndex);
    } catch(e) {
      console.error(e);
    }
  }

  setInstrumentSampleData(instrumentIndex, sampleIndex, data) {
    try {
      const instrument = this.song.instruments[instrumentIndex];
      while (sampleIndex >= instrument.samples.length) {
        this.addSampleToInstrument(instrumentIndex);
      }
      const sample = instrument.samples[sampleIndex];

      sample.sampledata.data = new Array(data.length);
      for(let i = 0; i < data.length; i += 1) {
        sample.sampledata.data[i] = data[i];
      }
      sample.len = data.length;
      sample.note = 29; // F-6
      sample.fine = -28; // Note: this presumes the sample is 44.1KHz

      this.instrumentChanged(instrumentIndex);
      this.sampleChanged(instrumentIndex, sampleIndex);
    } catch(e) {
      console.log(e);
    }
  }

  setInstrumentSampleName(instrumentIndex, sampleIndex, name) {
    try {
      const instrument = this.song.instruments[instrumentIndex];
      const sample = instrument.samples[sampleIndex];
      sample.name = name;
      this.instrumentChanged(instrumentIndex);
    } catch(e) {
      console.error(e);
    }
  }

  updateInstrument(instrumentIndex) {
    this.instrumentChanged(instrumentIndex);
  }

  setBPM(bpm) {
    this.song.bpm = bpm;
    this.bpmChanged(this.song.bpm);
  }

  setSpeed(speed) {
    this.song.speed = speed;
    this.speedChanged(this.song.speed);
  }

  setPatternLength(pattern, length) {
    if (pattern < this.song.patterns.length) {
      const oldlength = this.song.patterns[pattern].numrows;
      this.song.patterns[pattern].numrows = length;
      if (oldlength > length) {
        this.song.patterns[pattern].rows = this.song.patterns[pattern].rows.slice(1, length);
      }
      this.songChanged();
    }
  }

  setTrackName(trackIndex, name) {
    try {
      const track = this.song.tracks[trackIndex];
      track.name = name;
      this.trackChanged(trackIndex);
    } catch(e) {
      console.error(e);
    }
  }
}

export let song = new SongManager(); 
