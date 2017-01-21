import $ from 'jquery';
import LZ4 from 'lz4-asm';
import textEncoding from 'text-encoding';

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
    this.sequenceItemChanged = Signal.signal(false);
    this.trackChanged = Signal.signal(false);
    this.patternChanged = Signal.signal(false);

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
    if (!state.song.hasIn(["patterns", cursor.pattern])) {
      state.song.set({
        song: {
          patterns: state.song.get("patterns").set(cursor.pattern, Immutable.fromJS({
            patternid: `p${cursor.pattern}`,
            name: `Pattern ${cursor.pattern}`,
            numrows: 32,
            rows: [] 
          })),
        }
      });
    }

    if (!state.song.hasIn(["pattern", cursor.pattern, "rows", cursor.row])) {
      state.set({
        song: {
          patterns: state.song.get("patterns").setIn([cursor.pattern, "rows", cursor.row], new Immutable.List()),
        },
      });
    }

    if (!state.song.hasIn(["pattern", cursor.pattern, "rows", cursor.row, cursor.track])) {
      state.set({
        song: {
          patterns: state.song.get("patterns").setIn([cursor.pattern, "rows", cursor.row, cursor.track], Immutable.fromJS({
            trackindex: cursor.track,
            notedata: []
          })),
        },
      });
    }

    if (state.song.hasIn(["patterns", cursor.pattern, "rows", cursor.row, cursor.track, "notedata"])) {
      state.set({
        song: {
          patterns: state.song.get("patterns").setIn([cursor.pattern, "rows", cursor.row, cursor.track, "notedata"], new Immutable.List()),
        },
      });
    }

    if (!state.song.hasIn(["patterns", cursor.pattern, "rows", cursor.row, cursor.track, "notedata", cursor.column])) {
      state.set({
        song: {
          patterns: state.song.get("patterns").setIn([cursor.pattern, "rows", cursor.row, cursor.track, "notedata", cursor.column], new Immutable.Map()),
        },
      });
    }
    const notecol = state.song.getIn(["patterns", cursor.pattern, "rows", cursor.row, cursor.track, "notedata", cursor.column]);

    return notecol;
  }

  updateEventAtCursor(cursor, event) {
    if (state.song.hasIn(["patterns", cursor.pattern, "rows", cursor.row, cursor.track, "notedata"])) {
      state.set({
        song: {
          patterns: state.song.get("patterns").setIn([cursor.pattern, "rows", cursor.row, cursor.track, "notedata", cursor.column], event),
        }
      });
    } else if (state.song.hasIn(["patterns", cursor.pattern, "rows", cursor.row])) {
      const newTrack = {
        "notedata": [],
        trackindex: cursor.track,
      };
      newTrack.notedata[cursor.column] = event.toJS();
      state.set({
        song: {
          patterns: state.song.get("patterns").setIn([cursor.pattern, "rows", cursor.row, cursor.track], Immutable.fromJS(newTrack)),
        }
      });
    } else if (state.song.hasIn(["patterns", cursor.pattern])) {
      const newTrack = {
        "notedata": [],
        trackindex: cursor.track,
      };
      newTrack.notedata[cursor.column] = event.toJS();
      const newRow = [];
      newRow[cursor.track] = newTrack;
      state.set({
        song: {
          patterns: state.song.get("patterns").setIn([cursor.pattern, "rows", cursor.row], Immutable.fromJS(newRow)),
        }
      });
    } else {
      const newTrack = {
        "notedata": [],
        trackindex: cursor.track,
      };
      newTrack.notedata[cursor.column] = event.toJS();
      const newRow = [];
      newRow[cursor.track] = newTrack;
      const newPattern = {
        patternid: `p${cursor.pattern}`,
        name: `Pattern ${cursore.pattern}`,
        numrows: 32,
        rows: [] 
      };
      newPattern.rows[cursor.row] = newRow;
      state.set({
        song: {
          patterns: state.song.get("patterns").set(cursor.pattern, Immutable.fromJS(newPattern)), 
        }
      });
    }
  }

  addNoteToSong(cursor, note, instrument = null) {
    let notecol = this.findEventAtCursor(cursor);
    notecol = notecol.set("note", note);
    if (instrument != null) {
      notecol = notecol.set("instrument", instrument);
    }
    this.updateEventAtCursor(cursor, notecol);
    this.eventChanged(cursor, notecol.toJS());
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
      this.eventChanged(cursor, notecol.toJS());
    }

    this.updateEventAtCursor(cursor, notecol);
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
      this.eventChanged(cursor, notecol.toJS());
    }

    this.updateEventAtCursor(cursor, notecol);
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
      this.eventChanged(cursor, notecol.toJS());
    }

    this.updateEventAtCursor(cursor, notecol);
  }

  newSong() {
    let song = Immutable.fromJS(songdata).toJS();
    song.instruments.push(Immutable.fromJS(cymbal).toJS());
    song.instruments.push(Immutable.fromJS(pad).toJS());

    state.set({
      transport: {
        bpm: song.bpm,
        speed: song.speed,
      },
      song: song,
    });

    this.songChanged();
  }

  addInstrument() {
    const samplemap = new Array(96);
    const instid = state.song.get("instruments").size;
    try {
      state.set({
        song: {
          instruments: state.song.get("instruments").push(Immutable.fromJS({
            'name': `Instrument ${instid}`,
            'number': instid,
            'samples': [],
            samplemap,
          })),
        },
      });
    } catch(e) {
      console.log(e);
    }
    this.instrumentListChanged();

    return instid;
  }

  addSampleToInstrument(instrumentIndex) {
    const sampid = state.song.getIn(["instruments", instrumentIndex, "samples"]).size;
    try {
      state.set({
        song: {
          instruments: state.song.get("instruments").setIn([instrumentIndex, "samples"], state.song.getIn(["instruments", instrumentIndex, "samples"]).push(Immutable.fromJS({
            'len': 0, 
            'loop': 0,
            'looplen': 0, 
            'note': 0, 
            'fine': 0,
            'pan': 0, 
            'type': 0, 
            'vol': 0x40,
            'fileoffset': 0, 
            'name': `Sample ${sampid}`,
          }))),
        }
      });

      this.instrumentChanged(instrumentIndex);

      return sampid;
    } catch(e) {
      console.log(e);
    }
  }

  appendPattern() {
    const patternNo = state.song.get("patterns").size;
    state.set({
      song: {
        patterns: state.song.get("patterns").push(Immutable.fromJS({
          patternid: patternNo,
          name: `Pattern ${patternNo}`,
          numrows: 32,
          rows: [],
        })),
      }
    });
    return patternNo;
  }

  addPattern(sequence) {
    const pid = this.appendPattern();
    let pos = sequence + 1;
    if(!sequence || sequence > state.song.get("sequence").size) {
      pos = state.song.get("sequence").size;
    }
    state.set({
      cursor: {
        sequence: pos,
        pattern: pid,
      },
      song: {
        sequence: state.song.get("sequence").insert(pos, Immutable.fromJS({
          pattern: pid,
        })),
      }
    });
    this.sequenceChanged();
    this.patternChanged();
  }

  deletePattern(sequence) {
    let pos = sequence - 1;
    if (pos < 0) {
      pos = 0;
    }
    state.set({
      cursor: {
        sequence: pos,
        pattern: state.song.getIn(["sequence", pos, "pattern"]),
      },
      song: {
        sequence: state.song.get("sequence").delete(sequence),
      },
    });
    this.sequenceChanged();
  }

  clonePattern(sequence) {
    const donor = state.song.getIn(["patterns", state.song.getIn(["sequence", sequence, "pattern"])]);
    let newPattern = Immutable.fromJS(donor.toJS());
    const pid = state.song.get("patterns").size;
    newPattern = newPattern.merge({
      patternid: pid, 
      name: `Pattern ${pid}`,
    });
    let pos = sequence + 1;
    if(!sequence || sequence > state.song.get("sequence").size) {
      pos = state.song.get("sequence").size;
    }

    state.set({
      song: {
        patterns: state.song.get("patterns").push(newPattern),
        sequence: state.song.get("sequence").insert(pos, Immutable.fromJS({
          pattern: pid,
        })),
      },
      cursor: {
        sequence: pos,
        pattern: pid,
      },
    });

    this.sequenceChanged();
  }

  duplicatePattern(sequence) {
    const pid = state.song.getIn(["sequence", sequence, "pattern"]);
    let pos = sequence + 1;
    if(!sequence || sequence > state.song.get("sequence").size) {
      pos = state.song.get("sequence").size;
    }
    state.set({
      song: {
        sequence: state.song.get("sequence").insert(pos, Immutable.fromJS({
          pattern: pid,
        })),
      },
      cursor: {
        sequence: pos,
        pattern: pid,
      },
    });

    this.sequenceChanged();
  }

  updateSequencePattern(sequence, increment) {
    const val = state.song.getIn(["sequence", sequence, "pattern"]) + increment;
    if (val >= 0 && val >= state.song.get("patterns").size) {
      this.appendPattern();
    }
    if (val >= 0) {
      state.set({
        cursor: {
          val,
        },
        song: {
          sequence: state.song.get("sequence").setIn([sequence, "pattern"], val),
        },
      });

      this.sequenceItemChanged(sequence);
    }
  }

  setSong(song) {
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
        bpm: song.bpm,
        speed: song.speed,
      },
      song,
    });

    this.songChanged();
  }

  downloadSong(uri) {
    var promise = new Promise((resolve, reject) => {
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
          var newSong = this.loadSongFromArrayBuffer(arrayBuffer, filename);
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
    function download(buffer, name, type) {
      var a = document.createElement("a");
      var file = new Blob([buffer], {type: type});
      a.href = URL.createObjectURL(file);
      a.download = name;
      a.click();
    }

    let input = new Buffer(JSON.stringify(state.song.toJS(), (k, v) => {
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
    }));

    let output = LZ4.compress(input);

    const name = state.song.get("name");
    download(output, name ? `${name.trim()}.lz4` : 'wetracker-song.lz4', 'application/octet-stream');
  }

  loadSongFromFile(file, callback) {
    if (!file) {
      return;
    }
    var reader = new FileReader();
    reader.onload = (e) => {
      let contents = e.target.result;
      let song = this.loadSongFromArrayBuffer(contents, file.name);
      if(song) {
        if (callback) {
          callback(song);
        }
      }
    };
    reader.readAsArrayBuffer(file);
  }

  loadSongFromArrayBuffer(buffer, filename) {
    try {
      let json = undefined;
      try {
        let decomped = LZ4.decompress(new Uint8Array(buffer));
        json = new textEncoding.TextDecoder("utf-8").decode(decomped);
      } catch(e) {
        console.log(e);
        json = new textEncoding.TextDecoder("utf-8").decode(buffer);
      }
      var song = JSON.parse(json, (k, v) => {
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
      return song;
    } catch(e) {
      console.log(e);
      var song = xmloader.load(buffer, filename);
      return song;
    }
  }

  setInstrumentName(instrumentIndex, name) {
    try {
      state.set({
        song: {
          instruments: state.song.get("instruments").setIn([instrumentIndex, "name"], name),
        }
      });

      this.instrumentChanged(instrumentIndex);
    } catch(e) {
      console.error(e);
    }
  }

  setInstrumentSampleData(instrumentIndex, sampleIndex, data) {
    try {
      while (sampleIndex >= state.song.getIn(["instruments", instrumentIndex, "samples"]).size) {
        this.addSampleToInstrument(instrumentIndex);
      }

      let sampledata = new Array(data.length);
      for(let i = 0; i < data.length; i += 1) {
        sampledata[i] = data[i];
      }
      state.set({
        song: {
          instruments: state.song.get("instruments").setIn([instrumentIndex, "samples", sampleIndex], 
            state.song.getIn(["instruments", instrumentIndex, "samples", sampleIndex]).merge({
              len: data.length,
              note: 29, // F-6
              fine: -29, // Note: this presumes the sample is 44.1KHz
              sampledata: {
                data: sampledata,
              },
            }),
          ),
        },
      });

      this.instrumentChanged(instrumentIndex);
      this.sampleChanged(instrumentIndex, sampleIndex);
    } catch(e) {
      console.log(e);
    }
  }

  setInstrumentSampleName(instrumentIndex, sampleIndex, name) {
    try {
      state.set({
        song: {
          instruments: state.song.get("instruments").setIn([instrumentIndex, "samples", sampleIndex, "name"], name),
        }
      });

      this.instrumentChanged(instrumentIndex);
    } catch(e) {
      console.error(e);
    }
  }

  updateInstrument(instrumentIndex, data) {
    state.set({
      song: {
          instruments: state.song.get("instruments").set(instrumentIndex, Immutable.fromJS(data)), 
      }
    });
    this.instrumentChanged(instrumentIndex);
  }

  setBPM(bpm) {
    state.song.set("bpm", bpm);
    this.bpmChanged(bpm);
  }

  setSpeed(speed) {
    state.song.set("speed", speed);
    this.speedChanged(speed);
  }

  setPatternLength(pattern, length) {
    if (state.song.hasIn(["patterns", pattern])) {
      const oldlength = state.song.getIn(["patterns", pattern, "numrows"]);

      state.set({
        song: {
          patterns: state.song.get("patterns").set(pattern, 
            state.song.getIn(["patterns", pattern]).merge({
              numrows: length,
              rows: state.song.getIn(["patterns", pattern, "rows"]).setSize(length),
            })),
        }
      });
      this.songChanged();
    }
  }

  setTrackName(trackIndex, name) {
    try {
      state.set({
        song: {
          tracks: state.song.get("tracks").setIn([trackIndex, "name"], name),
        }
      });

      this.trackChanged(trackIndex);
    } catch(e) {
      console.error(e);
    }
  }

  /** 
   * Get the song name.
   *
   * @returns {string} The song name.
   */
  getSongName() {
    return state.song.get("name");
  }

  /** 
   * Get an instrument as a separate JS object for use outside the 
   * song. Changes to the returned object will have no effect on the
   * song data itself.
   *
   * @param {number} instrumentIndex The index of the instrument in the song.
   * @returns {Object} 
   */
  getInstrument(instrumentIndex) {
    return state.song.getIn(["instruments", instrumentIndex]).toJS();
  }

  /**
   * Get a list of all instrument names in the song.
   *
   * @returns {Array.} An array containing the names in indexed order of all
   * instruments in the song.
   */
  getInstrumentNames() {
    return state.song.get("instruments").map(i => i.get("name")).toJS();
  }

  /**
   * Get the number of instruments in the song. Includes empty slots.
   *
   * @returns {number} The total number of instruments in the song, including
   * empty slots.
   */
  getNumInstruments() {
    return state.song.get("instruments").size;
  }

  /**
   * Get a list of all track names in the song.
   *
   * @returns {Array.} An array containing the names in indexed order of all
   * tracks in the song.
   */
  getTrackNames() {
    return state.song.get("tracks").map(i => i.get("name")).toJS();
  }

  /**
   * Get the number of tracks in the song.
   *
   * @returns {number} The total number of tracks in the song.
   */
  getNumTracks() {
    return state.song.get("tracks").size;
  }

  /**
   * Get the initial song speed.
   *
   * @returns {number}
   */
  getSpeed() {
    return state.song.get("speed");
  }

  /**
   * Get the number of rows in the given pattern.
   *
   * @param patternIndex {number} The index of the pattern.
   *
   * @returns {number} The number of rows in the given pattern.
   */
  getPatternRowCount(patternIndex) {
    try {
      return state.song.getIn(["patterns", patternIndex, "numrows"]);
    } catch(e) {
      return 0;
    }
  }

  /**
   * Get the number of columns in the given track.
   *
   * @param trackIndex {number} The index of the track.
   *
   * @returns {number} The number of columns in the track.
   */
  getTrackNumColumns(trackIndex) {
    return state.song.getIn(["tracks", trackIndex, "columns"]).size;
  }

  /** 
   * Get the pattern number for the given index in the song sequence.
   *
   * @param sequenceIndex {number} The index in the sequence to retrieve.
   *
   * @returns {number} The pattern number at the given sequence index.
   */
  getSequencePatternNumber(sequenceIndex) {
    return state.song.getIn(["sequence", sequenceIndex, "pattern"]);
  }

  /** 
   * Get the length of the song sequence.
   *
   * @returns {number} The total number of entries in the song sequence.
   */
  getSequenceLength() {
    return state.song.get("sequence").size;
  }

  /** 
   * Get track event data for the given pattern, row and track.
   *
   * @param patternIndex {number} The index of the pattern to query.
   * @param rowNumber {number} The row in the pattern to query.
   * @param trackIndex {number} The track number in the row to query.
   *
   * @returns {Object} A representation of the track data as a JS Object.
   */
  getTrackDataForPatternRow(patternIndex, rowNumber, trackIndex) {
    try {
      return state.song.getIn(["patterns", patternIndex, "rows", rowNumber, trackIndex]).toJS();
    } catch(e) {
      return {};
    }
  }

  /** 
   * Get sequence as an array of pattern indexes.
   *
   * @returns {Array.number} An array of pattern indexes.
   */
  getSequencePatterns() {
    try {
      return state.song.get("sequence").map( a => a.get("pattern") ).toJS();
    } catch(e) {
      console.log(e);
      return [];
    }
  }
}

export let song = new SongManager(); 
