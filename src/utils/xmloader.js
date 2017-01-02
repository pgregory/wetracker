
class XMLoader {
  constructor() {
    // for pretty-printing notes
    this._note_names = [
      "C-", "C#", "D-", "D#", "E-", "F-",
      "F#", "G-", "G#", "A-", "A#", "B-"
    ];
  }

  getstring(dv, offset, len) {
    var str = [];
    for (var i = offset; i < offset+len; i++) {
      var c = dv.getUint8(i);
      if (c === 0) break;
      str.push(String.fromCharCode(c));
    }
    return str.join('');
  }

  ConvertSample(array, bits) {
    var len = array.length;
    var acc = 0;
    var samp, b, k;
    if (bits === 0) {  // 8 bit sample
      samp = new Float32Array(len);
      for (k = 0; k < len; k++) {
        acc += array[k];
        b = acc&255;
        if (b & 128) b = b-256;
        samp[k] = b / 128.0;
      }
      return samp;
    } else {
      len /= 2;
      samp = new Float32Array(len);
      for (k = 0; k < len; k++) {
        acc += (array[k*2] + (array[k*2 + 1] << 8));
        b = acc&65535;
        if (b & 32768) b = b-65536;
        samp[k] = b / 32768.0;
      }
      return samp;
    }
  }

  prettify_note(note) {
    if (note < 0) return "---";
    if (note == 96) return "^^^";
    return this._note_names[note%12] + ~~(note/12);
  }

  prettify_number(num) {
    if (num == -1) return "--";
    if (num < 10) return "0" + num;
    return num;
  }

  prettify_volume(num) {
    if (num < 0x10) return "--";
    return num.toString(16);
  }

  prettify_effect(t, p) {
    if (t >= 10) t = String.fromCharCode(55 + t);
    if (p < 16) p = '0' + p.toString(16);
    else p = p.toString(16);
    return t + p;
  }

  prettify_notedata(data) {
    return (this.prettify_note(data[0]) + " " + this.prettify_number(data[1]) + " " +
        this.prettify_volume(data[2]) + " " +
        this.prettify_effect(data[3], data[4]));
  }


  load(arrayBuf, filename = "") {
    var dv = new DataView(arrayBuf);

    var newSong = {};

    newSong.tracks = [];
    newSong.patterns = [];
    newSong.sequence = [];

    var songname = this.getstring(dv, 17, 20);
    if(songname && songname.length > 0) {
      newSong.name = songname;
    } else {
      newSong.name = filename || "No Name";
    }

    var hlen = dv.getUint32(0x3c, true) + 0x3c;
    var songlen = dv.getUint16(0x40, true);
    var looppos = dv.getUint16(0x42, true);
    var numTracks = dv.getUint16(0x44, true);
    var npat = dv.getUint16(0x46, true);
    var ninst = dv.getUint16(0x48, true);
    var flags = dv.getUint16(0x4a, true);
    newSong.flags = flags;
    var speed = dv.getUint16(0x4c, true);
    var bpm = dv.getUint16(0x4e, true);

    newSong.globalVolume = this.max_global_volume;

    newSong.speed = speed;
    newSong.bpm = bpm;
    newSong.loopPosition = looppos;

    var i, j, k;

    for (i = 0; i < numTracks; i++) {
      newSong.tracks.push({
        id: `track${i}`,
        fxcolumns: 1,
        name: `Track${i}`,
        type: 'play',
        color: '#008800',
        id: `track${i}`,
        columns: [
          {
            id: 'c1',
          },
        ],
      });
    }
    console.log("header len " + hlen);

    console.log("songlen %d, %d channels, %d patterns, %d instruments", songlen, numTracks, npat, ninst);
    console.log("loop @%d", newSong.loopPosition);
    console.log("flags=%d speed %d bpm %d", this.flags, newSong.speed, newSong.bpm);

    let maxPat = 0;
    for (i = 0; i < songlen; i++) {
      var pat = dv.getUint8(0x50 + i);
      newSong.sequence.push({pattern: pat});
      maxPat = Math.max(maxPat, pat);
    }
    console.log("song patterns: ", newSong.sequence);

    // Fill in the pattern list first, to the maxPat, in case there are any
    // patterns specified in the sequence that aren't in the pattern list.
    for (i = 0; i <= maxPat; i++) {
      newSong.patterns[i] = {
        patternid: `p${i}`,
        name: `Pattern ${i}`,
        numrows: 32,
        rows: [],
      };
    }

    var idx = hlen;
    for (i = 0; i < npat; i++) {
      var patheaderlen = dv.getUint32(idx, true);
      var patrows = dv.getUint16(idx + 5, true);
      var patsize = dv.getUint16(idx + 7, true);
      console.log("pattern %d: %d bytes, %d rows", i, patsize, patrows);
      idx += 9;

      newSong.patterns[i] = {
        patternid: `p${i}`,
        name: `Pattern ${i}`,
        numrows: patrows,
        rows: [],
      };

      for (j = 0; patsize > 0 && j < patrows; j++) {
        var row = [];
        for (k = 0; k < newSong.tracks.length; k++) {
          var byte0 = dv.getUint8(idx); idx++;
          var note = -1, inst = -1, vol = -1, efftype = 0, effparam = 0;
          if (byte0 & 0x80) {
            if (byte0 & 0x01) {
              note = dv.getUint8(idx) - 1; idx++;
            }
            if (byte0 & 0x02) {
              inst = dv.getUint8(idx); idx++;
            }
            if (byte0 & 0x04) {
              vol = dv.getUint8(idx); idx++;
            }
            if (byte0 & 0x08) {
              efftype = dv.getUint8(idx); idx++;
            }
            if (byte0 & 0x10) {
              effparam = dv.getUint8(idx); idx++;
            }
          } else {
            // byte0 is note from 1..96 or 0 for nothing or 97 for release
            // so we subtract 1 so that C-0 is stored as 0
            note = byte0 - 1;
            inst = dv.getUint8(idx); idx++;
            vol = dv.getUint8(idx); idx++;
            efftype = dv.getUint8(idx); idx++;
            effparam = dv.getUint8(idx); idx++;
          }
          if(note !== -1 || inst !== -1 || vol !== -1 || efftype != -1 || effparam !== 0) {
            row[k] = { 
              notedata: [
                {
                  columnindex: 0,
                  note,
                  instrument: inst,
                  volume: vol,
                  fxtype: efftype,
                  fxparam: effparam,
                }
              ]
            };
          }
        }
        newSong.patterns[i].rows.push(row);
      }
    }
    
    newSong.instruments = [];
    // now load instruments
    for (i = 0; i < ninst; i++) {
      var hdrsiz = dv.getUint32(idx, true);
      var instname = this.getstring(dv, idx+0x4, 22);
      var nsamp = dv.getUint16(idx+0x1b, true);
      var inst = {
        'name': instname,
        'number': i,
      };
      if (nsamp > 0) {
        var samplemap = new Uint8Array(arrayBuf, idx+33, 96);

        var env_nvol = dv.getUint8(idx+225);
        var env_vol_type = dv.getUint8(idx+233);
        var env_vol_sustain = dv.getUint8(idx+227);
        var env_vol_loop_start = dv.getUint8(idx+228);
        var env_vol_loop_end = dv.getUint8(idx+229);
        var env_npan = dv.getUint8(idx+226);
        var env_pan_type = dv.getUint8(idx+234);
        var env_pan_sustain = dv.getUint8(idx+230);
        var env_pan_loop_start = dv.getUint8(idx+231);
        var env_pan_loop_end = dv.getUint8(idx+232);
        var vol_fadeout = dv.getUint16(idx+239, true);

        inst.fadeout = vol_fadeout;
        var env_vol = [];
        for (j = 0; j < env_nvol*2; j++) {
          env_vol.push(dv.getUint16(idx+129+j*2, true));
        }
        var env_pan = [];
        for (j = 0; j < env_npan*2; j++) {
          env_pan.push(dv.getUint16(idx+177+j*2, true));
        }
        // FIXME: ignoring keymaps for now and assuming 1 sample / instrument
        // var keymap = getarray(dv, idx+0x21);
        var samphdrsiz = dv.getUint32(idx+0x1d, true);
        console.log("hdrsiz %d; instrument %s: '%s' %d samples, samphdrsiz %d",
            hdrsiz, (i+1).toString(16), instname, nsamp, samphdrsiz);
        idx += hdrsiz;
        var totalsamples = 0;
        var samps = [];
        for (j = 0; j < nsamp; j++) {
          var samplen = dv.getUint32(idx, true);
          var samploop = dv.getUint32(idx+4, true);
          var samplooplen = dv.getUint32(idx+8, true);
          var sampvol = dv.getUint8(idx+12);
          var sampfinetune = dv.getInt8(idx+13);
          var samptype = dv.getUint8(idx+14);
          var samppan = dv.getUint8(idx+15);
          var sampnote = dv.getInt8(idx+16);
          var sampname = this.getstring(dv, idx+18, 22);
          var sampleoffset = totalsamples;
          if (samplooplen === 0) {
            samptype &= ~3;
          }
          console.log("sample %d: len %d name '%s' loop %d/%d vol %d offset %s",
              j, samplen, sampname, samploop, samplooplen, sampvol, sampleoffset.toString(16));
          console.log("           type %d note %s(%d) finetune %d pan %d",
              samptype, this.prettify_note(sampnote + 12*4), sampnote, sampfinetune, samppan);
          console.log("           vol env", env_vol, env_vol_sustain,
              env_vol_loop_start, env_vol_loop_end, "type", env_vol_type,
              "fadeout", vol_fadeout);
          console.log("           pan env", env_pan, env_pan_sustain,
              env_pan_loop_start, env_pan_loop_end, "type", env_pan_type);
          var samp = {
            'len': samplen, 'loop': samploop,
            'looplen': samplooplen, 'note': sampnote, 'fine': sampfinetune,
            'pan': samppan, 'type': samptype, 'vol': sampvol,
            'fileoffset': sampleoffset, 'name': sampname,
          };
          // length / pointers are all specified in bytes; fixup for 16-bit samples
          samps.push(samp);
          idx += samphdrsiz;
          totalsamples += samplen;
        }
        for (j = 0; j < nsamp; j++) {
          var samp = samps[j];
          samp.sampledata = this.ConvertSample(
              new Uint8Array(arrayBuf, idx + samp.fileoffset, samp.len), samp.type & 16);
          if (samp.type & 16) {
            samp.len /= 2;
            samp.loop /= 2;
            samp.looplen /= 2;
          }
        }
        idx += totalsamples;
        inst.samplemap = samplemap;
        inst.samples = samps;
        if (env_vol_type) {
          // insert an automatic fadeout to 0 at the end of the envelope
          // Removed: need the envelope to remain as defined for editing.
          // Need to find another way to do fadeout.
          var env_end_tick = env_vol[env_vol.length-2];
          if (!(env_vol_type & 2)) {  // if there's no sustain point, create one
            env_vol_sustain = env_vol.length / 2;
          }
          /*if (vol_fadeout > 0) {
            var fadeout_ticks = 65536.0 / vol_fadeout;
            env_vol.push(env_end_tick + fadeout_ticks);
            env_vol.push(0);
          }*/
          inst.env_vol = { 
              points: env_vol,
              type: env_vol_type,
              sustain: env_vol_sustain,
              loopstart: env_vol_loop_start,
              loopend: env_vol_loop_end,
          };
        } else {
          // no envelope, then just make a default full-volume envelope.
          // i thought this would use fadeout, but apparently it doesn't.
          inst.env_vol = {
            points: [0, 64, 1, 0], 
            type: 2,
            sustain: 0,
            loopstart: 0,
            loopend: 0,
          };
        }
        if (env_pan_type) {
          if (!(env_pan_type & 2)) {  // if there's no sustain point, create one
            env_pan_sustain = env_pan.length / 2;
          }
          inst.env_pan = { 
              points: env_pan,
              type: env_pan_type,
              sustain: env_pan_sustain,
              loopstart: env_pan_loop_start,
              loopend: env_pan_loop_end,
          };
        } else {
          // create a default empty envelope
          inst.env_pan = {
            points: [0, 32],
            type: 0,
            sustain: 0,
            loopstart: 0,
            loopend: 0,
          };
        }
      } else {
        idx += hdrsiz;
        console.log("empty instrument", i, hdrsiz, idx);
      }
      newSong.instruments.push(inst);
    }

    console.log("loaded \"" + newSong.name + "\"");

    return newSong;
  }
}

export let xmloader = new XMLoader(); 
