import $ from 'jquery';
import LZ4 from 'lz4-asm';
import textEncoding from 'text-encoding';

import defsong from '../../data/defaultsong.lz4';

import {encode, decode} from 'tab64';

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
    this.trackEffectChainChanged = Signal.signal(false);
    this.trackEffectChanged = Signal.signal(false);

    Signal.connect(state, "songChanged", this, "onStateSongChanged");

    this.eventEntries = [
      'note',
      'instrument',
      'volume',
      'fxtype',
      'fxparam',
    ];

    this.emptyEvent = {
      note: -1,
      instrument: -1,
      volume: -1,
      fxtype: 0,
      fxparam: 0,
    };


    this.eventIndices = [
      { itemIndex: 0, mask: 0, shift: 0 },   // Note
      { itemIndex: 1, mask: 0x0F, shift: 4}, // Instrument H
      { itemIndex: 1, mask: 0xF0, shift: 0}, // Instrument L
      { itemIndex: 2, mask: 0x0F, shift: 4}, // Volume H
      { itemIndex: 2, mask: 0xF0, shift: 0}, // Volume L
      { itemIndex: 3, mask: 0x00, shift: 0}, // Effect Type
      { itemIndex: 4, mask: 0x0F, shift: 4}, // Effect Param H
      { itemIndex: 4, mask: 0xF0, shift: 0}, // Effect Param L
    ];
  }

  onStateSongChanged() {
    this.songChanged();
  }

  eventItemName(item) {
    const eventItem = this.eventIndices[item].itemIndex;
    if (eventItem < this.eventEntries.length) {
      return this.eventEntries[eventItem];
    } else {
      return "unknown";
    }
  }

  findEventAtCursor(cursor) {
    let notecol = new Immutable.Map();
    try {
      notecol = state.song.getIn(["patterns", cursor.pattern, "rows", cursor.row, cursor.track, "notedata", cursor.column]) || new Immutable.Map();
    } catch(e) {
      console.log(e);
    }
    return notecol;
  }

  updateEventAtCursor(cursor, event, annotation) {
    if (cursor.pattern > this.getNumPatterns() || 
        cursor.row > this.getPatternRowCount(cursor.pattern) || 
        cursor.track > this.getNumTracks() || 
        cursor.column > this.getTrackNumColumns(cursor.track)) {
      throw "Attempt to set data at invalid place in song: " + cursor;
      return;
    }
    if (state.song.hasIn(["patterns", cursor.pattern, "rows", cursor.row, cursor.track, "notedata"])) {
      state.set({
        song: {
          patterns: state.song.get("patterns").setIn([cursor.pattern, "rows", cursor.row, cursor.track, "notedata", cursor.column], event),
        }
      }, annotation);
    } else if ((state.song.hasIn(["patterns", cursor.pattern, "rows", cursor.row])) &&
               (state.song.getIn(["patterns", cursor.pattern, "rows", cursor.row]) != null)) {
      const newTrack = {
        "notedata": [],
        trackindex: cursor.track,
      };
      newTrack.notedata[cursor.column] = event.toJS();
      state.set({
        song: {
          patterns: state.song.get("patterns").setIn([cursor.pattern, "rows", cursor.row, cursor.track], Immutable.fromJS(newTrack)),
        }
      }, annotation);
    } else if ((state.song.hasIn(["patterns", cursor.pattern])) &&
               (state.song.getIn(["patterns", cursor.pattern]) != null)) {
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
      }, annotation);
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
      }, annotation);
    }
  }

  addNoteToSong(cursor, note, instrument = null) {
    let notecol = this.findEventAtCursor(cursor);
    notecol = notecol.set("note", note);
    if (instrument != null) {
      notecol = notecol.set("instrument", instrument);
    }
    this.updateEventAtCursor(cursor, notecol, "Change note in pattern");
    this.eventChanged(cursor, notecol.toJS());
  }

  deleteItemAtCursor(cursor) {
    const eventItem = this.eventIndices[cursor.item].itemIndex;
    if (eventItem < this.eventEntries.length) {
      const entry = this.eventEntries[eventItem];

      let notecol = this.findEventAtCursor(cursor);
      notecol = notecol.delete(entry);

      this.updateEventAtCursor(cursor, notecol, `Delete ${this.eventItemName(cursor.item)} from pattern`);
      this.eventChanged(cursor, notecol.toJS());
    }
  }

  deleteRow(row) {
    if(row >= 0 && row < this.getPatternRowCount(state.cursor.get("pattern"))) {
      state.set({
        song: {
          patterns: state.song.get("patterns").deleteIn([state.cursor.get("pattern"), "rows", row]),
        }
      }, "Delete row");
      this.patternChanged();
    }
  }

  setHexValueAtCursor(cursor, value) {
    const eventItem = this.eventIndices[cursor.item].itemIndex;
    if (eventItem < this.eventEntries.length) {
      const entry = this.eventEntries[eventItem];
      const mask = this.eventIndices[cursor.item].mask
      const shift = this.eventIndices[cursor.item].shift
      const vald = value << shift;

      let notecol = this.findEventAtCursor(cursor);
      notecol = notecol.set(entry, (notecol.get(entry) & mask) | vald);
      if (entry === 'fxparam' && (!(notecol.has('fxtype')) || notecol.get('fxtype') === -1)) {
        notecol = notecol.set('fxtype', 0);
      }
      this.updateEventAtCursor(cursor, notecol, `Edit ${this.eventItemName(cursor.item)} in pattern`);
      this.eventChanged(cursor, notecol.toJS());
    }
  }

  setFXAtCursor(cursor, value) {
    let vald = value;
    if(cursor.item !== 5) {
      return;
    }

    const eventItem = this.eventIndices[cursor.item].itemIndex;
    if (eventItem < this.eventEntries.length) {
      let notecol = this.findEventAtCursor(cursor);
      notecol = notecol.set("fxtype", value);
      if(!(notecol.has("fxparam")) || notecol.get("fxparam") === -1) {
        notecol = notecol.set("fxparam", 0);
      }
      this.updateEventAtCursor(cursor, notecol, `Edit ${this.eventItemName(cursor.item)} in pattern`);
      this.eventChanged(cursor, notecol.toJS());
    }
  }

  newSong() {
    let newSong = this.loadSongFromArrayBuffer(defsong, "DefaultSong.lz4");
    if (newSong) {
      this.setSong(newSong);
    }
  }

  addInstrument() {
    const samplemap = new Array(96).fill(0);
    const instid = state.song.get("instruments").size;
    try {
      state.set({
        song: {
          instruments: state.song.get("instruments").push(Immutable.fromJS({
            'name': `Instrument ${instid}`,
            'number': instid,
            'samples': [],
            samplemap,
            fadeout: 80,
          })),
        },
      }, "Add instrument");
    } catch(e) {
      console.log(e);
    }
    this.instrumentListChanged();

    return instid;
  }

  addSampleToInstrument(instrumentIndex) {
    let sampid = undefined;
    let samples = undefined;
    let samplemap = undefined;
    try {
      samples = state.song.getIn(["instruments", instrumentIndex, "samples"]);
      samplemap = state.song.getIn(["instruments", instrumentIndex, "samplemap"]);
      if (samples == null) {
        samples = new Immutable.List();
      }
      if (samplemap == null) {
        samplemap = Immutable.fromJS(new Uint8Array(96).fill(0));
      }
      sampid = samples.size;
    } catch(e) {
      samples = new Immutable.List();
      sampid = 0;
    }
    try {
      state.set({
        song: {
          instruments: state.song.get("instruments").set(instrumentIndex, state.song.getIn(["instruments", instrumentIndex]).merge({
            samples: samples.push(Immutable.fromJS({
              'len': 0, 
              'loop': 0,
              'looplen': 0, 
              'note': 0, 
              'fine': 0,
              'pan': 0x80, 
              'type': 0, 
              'vol': 0x40,
              'fileoffset': 0, 
              'name': `Sample ${sampid}`,
            })),
            samplemap,
          })),
        }
      }, "Add sample to instrument");

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
    }, "Append pattern");
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
    }, "Add pattern to sequence");
    this.sequenceChanged();
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
    }, "Delete pattern");
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
    }, "Clone pattern");

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
    }, "Duplicate pattern");

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
      }, "Change sequence pattern number");

      this.sequenceItemChanged(sequence);
    }
  }

  validateSong(song) {
    // Check all instruments have fadeout.
    for (let i = 0; i < song.instruments.length; i += 1) {
      if (!song.instruments[i].fadeout) {
        song.instruments[i].fadeout = 80;
      }
    }
    return song;
  }

  setSong(song) {
    state.set({
      transport: {
        bpm: song.bpm,
        speed: song.speed,
      },
      song: this.validateSong(song),
    });

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

    state.clearHistory();
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
        let sampledata = encode(new Float32Array(v.data));
        return Object.assign(v, {
            data: sampledata,
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
              const sampledata = new Float32Array(decode(v.data, 'float32'));
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
      }, "Set instrument name");

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
      }, "Set sample data");

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
      }, "Set sample name");

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
    }, "Change instrument");
    this.instrumentChanged(instrumentIndex);
  }

  setBPM(bpm) {
    state.set({
      song: {
        bpm,
      }
    }, "Set bpm");
    this.bpmChanged(bpm);
  }

  setSpeed(speed) {
    state.set({
      song: {
        speed,
      }
    });
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
      }, "Change pattern length");
      this.songChanged();
    }
  }

  setTrackName(trackIndex, name) {
    try {
      state.set({
        song: {
          tracks: state.song.get("tracks").setIn([trackIndex, "name"], name),
        }
      }, "Set track name");

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
    try {
      return state.song.get("name");
    } catch(e) {
      return "";
    }
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
    try {
      return state.song.getIn(["instruments", instrumentIndex]).toJS();
    } catch(e) {
      return {};
    }
  }

  /**
   * Get a list of all instrument names in the song.
   *
   * @returns {Array.} An array containing the names in indexed order of all
   * instruments in the song.
   */
  getInstrumentNames() {
    try {
      return state.song.get("instruments").map(i => i.get("name")).toJS();
    } catch(e) {
      return [];
    }
  }

  /**
   * Get the number of instruments in the song. Includes empty slots.
   *
   * @returns {number} The total number of instruments in the song, including
   * empty slots.
   */
  getNumInstruments() {
    try {
      return state.song.get("instruments").size;
    } catch(e) {
      return 0;
    }
  }

  /**
   * Get a list of all track names in the song.
   *
   * @returns {Array.} An array containing the names in indexed order of all
   * tracks in the song.
   */
  getTrackNames() {
    try {
      return state.song.get("tracks").map(i => i.get("name")).toJS();
    } catch(e) {
      return [];
    }
  }

  /**
   * Get the number of tracks in the song.
   *
   * @returns {number} The total number of tracks in the song.
   */
  getNumTracks() {
    try {
      return state.song.get("tracks").size;
    } catch(e) {
      return 0;
    }
  }

  /**
   * Get the initial song speed.
   *
   * @returns {number}
   */
  getSpeed() {
    try {
      return state.song.get("speed");
    } catch(e) {
      return 4;
    }
  }

  /**
   * Get the initial song bpm.
   *
   * @returns {number}
   */
  getBpm() {
    try {
      return state.song.get("bpm");
    } catch(e) {
      return 120;
    }
  }

  /**
   * Get the loop position in the sequence.
   *
   * @returns {number} The sequence index to loop back to.
   */
  getLoopPosition() {
    try {
      return state.song.get("loopPosition");
    } catch(e) {
      return 0;
    }
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
    try {
      return state.song.getIn(["tracks", trackIndex, "columns"]).size;
    } catch(e) {
      return 0;
    }
  }

  /** 
   * Get the pattern number for the given index in the song sequence.
   *
   * @param sequenceIndex {number} The index in the sequence to retrieve.
   *
   * @returns {number} The pattern number at the given sequence index.
   */
  getSequencePatternNumber(sequenceIndex) {
    try {
      return state.song.getIn(["sequence", sequenceIndex, "pattern"]);
    } catch(e) {
      return 0;
    }
  }

  /** 
   * Get the length of the song sequence.
   *
   * @returns {number} The total number of entries in the song sequence.
   */
  getSequenceLength() {
    try {
      return state.song.get("sequence").size;
    } catch(e) {
      return 0;
    }
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

  /** 
   * Get number of patterns in the song.
   *
   * @returns {number}
   */
  getNumPatterns() {
    try {
      return state.song.get("patterns").size;
    } catch(e) {
      return 0;
    }
  }

  /**
   * Set track data for given pattern, row, track, and column
   *
   * @param patternIndex {number} pattern number to update
   * @param rowNumber {number} row number in the pattern
   * @param trackIndex {number} track number in the row
   * @param columnIndex {number} column in the track
   * @param event {Object} the event data to set at that song position.
   */
  setEventAtPattarnRowTrackColumn(patternIndex, rowNumber, trackIndex, columnIndex, event) {
    this.updateEventAtCursor({pattern: patternIndex, row: rowNumber, track: trackIndex, column: columnIndex}, Immutable.fromJS(event));
  }

  /**
   * Add track
   */
  addTrack() {
    state.set({
      song: {
        tracks: state.song.get("tracks").push(Immutable.fromJS({
          fxcolumns: 1,
          name: `Track ${this.getNumTracks()}`,
          type: "play",
          color: "#999999",
          columns: [
            {
              id: "c1",
            }
          ],
        })),
      }
    });
    this.songChanged();
  }

  /**
   * Remove track
   */
  removeTrack(index) {
    state.set({
      song: {
        tracks: state.song.get("tracks").delete(index),
      }
    });
    this.songChanged();
  }

  /**
   * Get track effects
   */
  getTrackEffects(index) {
    try {
      return state.song.getIn(["tracks", index, "effects"]).toJS();
    } catch(e) {
      return [];
    }
  }

  /**
   * Append a new effect to the end of the chain on the specified track.
   */
  appendEffectToTrackChain(trackIndex, effect) {
    try {
      let effects = new Immutable.List();
      if (state.song.hasIn(["tracks", trackIndex, "effects"])) {
        effects = state.song.getIn(["tracks", trackIndex, "effects"]);
      }
      state.set({
        song: state.song.setIn(["tracks", trackIndex, "effects"], effects.push(effect)),
      }, "Add effect to track");
      this.trackEffectChainChanged(trackIndex);
    } catch(e) {
      console.log(e);
    }
  }

  /** 
   * Update the effect data for an effect in the chain associated with the given track.
   */
  updateTrackEffect(track, index, effect) {
    try {
      state.set({
        song: state.song.setIn(["tracks", track, "effects", index], effect),
      }, "Update track effect");
    } catch(e) {
      console.log(e);
    }
    this.trackEffectChanged(track, index, effect);
  }

  /**
   * Move an effect in the chain to a new position.
   */
  moveTrackEffectInChain(track, from, to) {
    try {
      let chain = state.song.getIn(["tracks", track, "effects"]);
      let olditem = chain.get(from);
      chain = chain.delete(from).insert(to, olditem);
      state.set({
        song: state.song.setIn(["tracks", track, "effects"], chain),
      }, "Move effect in track chain");
      this.trackEffectChainChanged(track);
    } catch(e) {
      console.log(e);
    }
  }

  /** 
   * Delete an effect from the chain on the specified track.
   */
  deleteTrackEffectFromChain(track, index) {
    let chain = state.song.getIn(["tracks", track, "effects"]);
    if(index < chain.size) {
      try {
        state.set({
          song: state.song.setIn(["tracks", track, "effects"], chain.delete(index)),
        }, "Delete track effect");
        this.trackEffectChainChanged(track);
      } catch(e) {
        console.log(e);
      }
    }
  }
}



export let song = new SongManager(); 
