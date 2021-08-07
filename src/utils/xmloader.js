/* eslint no-bitwise: "off" */
class XMLoader {
  constructor() {
    // for pretty-printing notes
    this.noteNames = [
      'C-', 'C#', 'D-', 'D#', 'E-', 'F-',
      'F#', 'G-', 'G#', 'A-', 'A#', 'B-',
    ];
  }

  getstring(dv, offset, len) {
    const str = [];
    for (let i = offset; i < offset + len; i += 1) {
      const c = dv.getUint8(i);
      if (c === 0) {
        break;
      }
      str.push(String.fromCharCode(c));
    }
    return str.join('');
  }

  ConvertSample(array, bits) {
    let len = array.length;
    let acc = 0;
    const samp = {};
    let b;
    let k;
    if (bits === 0) {  // 8 bit sample
      samp.data = new Float32Array(len);
      for (k = 0; k < len; k += 1) {
        acc += array[k];
        b = acc & 255;
        if (b & 128) {
          b -= 256;
        }
        samp.data[k] = b / 128.0;
      }
      samp.originalBits = 8;
      samp.format = 'raw';
      return samp;
    }

    len /= 2;
    samp.data = new Float32Array(len);
    for (k = 0; k < len; k += 1) {
      acc += (array[k * 2] + (array[(k * 2) + 1] << 8));
      b = acc & 65535;
      if (b & 32768) {
        b -= 65536;
      }
      samp.data[k] = b / 32768.0;
      samp.originalBits = 16;
      samp.format = 'raw';
    }
    return samp;
  }

  prettifyNote(note) {
    if (note < 0) {
      return '---';
    }
    if (note === 96) {
      return '^^^';
    }
    return this.noteNames[note % 12] + ~~(note / 12);
  }

  prettifyNumber(num) {
    if (num === -1) {
      return '--';
    }
    if (num < 10) {
      return `0 ${num}`;
    }
    return num;
  }

  prettifyVolume(num) {
    if (num < 0x10) {
      return '--';
    }
    return num.toString(16);
  }

  prettifyEffect(t, p) {
    let td = t;
    let pd = p;
    if (t >= 10) {
      td = String.fromCharCode(55 + t);
    }
    if (p < 16) {
      pd = `0 ${p.toString(16)}`;
    } else {
      pd = p.toString(16);
    }
    return `${td}${pd}`;
  }

  prettifyNotedata(data) {
    const n = this.prettifyNote(data[0]);
    const i = this.prettifyNumber(data[1]);
    const v = this.prettifyVolume(data[2]);
    const f = this.prettifyEffect(data[3], data[4]);

    return `${n} ${i} ${v} ${f}`;
  }

  load(arrayBuf, filename = '') {
    console.log(arrayBuf);
    const dv = new DataView(arrayBuf);
    const newSong = {};

    newSong.tracks = [];
    newSong.patterns = [];
    newSong.sequence = [];

    const songname = this.getstring(dv, 17, 20);
    if (songname && songname.length > 0) {
      newSong.name = songname;
    } else {
      newSong.name = filename || 'No Name';
    }

    const hlen = dv.getUint32(0x3c, true) + 0x3c;
    const songlen = dv.getUint16(0x40, true);
    const looppos = dv.getUint16(0x42, true);
    const numTracks = dv.getUint16(0x44, true);
    const npat = dv.getUint16(0x46, true);
    const ninst = dv.getUint16(0x48, true);
    const flags = dv.getUint16(0x4a, true);
    newSong.flags = flags;
    const speed = dv.getUint16(0x4c, true);
    const bpm = dv.getUint16(0x4e, true);

    newSong.globalVolume = this.max_global_volume;

    newSong.speed = speed;
    newSong.bpm = bpm;
    newSong.loopPosition = looppos;

    for (let i = 0; i < numTracks; i += 1) {
      newSong.tracks.push({
        id: `track${i}`,
        fxcolumns: 1,
        name: `Track${i}`,
        type: 'play',
        color: '#008800',
        columns: [
          {
            id: 'c1',
          },
        ],
      });
    }
    console.log(`header len ${hlen}`);

    console.log('songlen %d, %d channels, %d patterns, %d instruments', songlen, numTracks, npat, ninst);
    console.log('loop @%d', newSong.loopPosition);
    console.log('flags=%d speed %d bpm %d', this.flags, newSong.speed, newSong.bpm);

    let maxPat = 0;
    for (let i = 0; i < songlen; i += 1) {
      const pat = dv.getUint8(0x50 + i);
      newSong.sequence.push({ pattern: pat });
      maxPat = Math.max(maxPat, pat);
    }
    console.log('song patterns: ', newSong.sequence);

    // Fill in the pattern list first, to the maxPat, in case there are any
    // patterns specified in the sequence that aren't in the pattern list.
    for (let i = 0; i <= maxPat; i += 1) {
      newSong.patterns[i] = {
        patternid: `p${i}`,
        name: `Pattern ${i}`,
        numrows: 32,
        rows: [],
      };
    }

    let idx = hlen;
    for (let i = 0; i < npat; i += 1) {
      const patrows = dv.getUint16(idx + 5, true);
      const patsize = dv.getUint16(idx + 7, true);
      console.log('pattern %d: %d bytes, %d rows', i, patsize, patrows);
      idx += 9;

      newSong.patterns[i] = {
        patternid: `p${i}`,
        name: `Pattern ${i}`,
        numrows: patrows,
        rows: [],
      };

      for (let j = 0; patsize > 0 && j < patrows; j += 1) {
        const row = [];
        for (let k = 0; k < newSong.tracks.length; k += 1) {
          const byte0 = dv.getUint8(idx);
          idx += 1;
          let note = -1;
          let inst = -1;
          let vol = -1;
          let efftype = 0;
          let effparam = 0;
          if (byte0 & 0x80) {
            if (byte0 & 0x01) {
              note = dv.getUint8(idx) - 1;
              idx += 1;
            }
            if (byte0 & 0x02) {
              inst = dv.getUint8(idx);
              idx += 1;
            }
            if (byte0 & 0x04) {
              vol = dv.getUint8(idx);
              idx += 1;
            }
            if (byte0 & 0x08) {
              efftype = dv.getUint8(idx);
              idx += 1;
            }
            if (byte0 & 0x10) {
              effparam = dv.getUint8(idx);
              idx += 1;
            }
          } else {
            // byte0 is note from 1..96 or 0 for nothing or 97 for release
            // so we subtract 1 so that C-0 is stored as 0
            note = byte0 - 1;
            inst = dv.getUint8(idx);
            idx += 1;
            vol = dv.getUint8(idx);
            idx += 1;
            efftype = dv.getUint8(idx);
            idx += 1;
            effparam = dv.getUint8(idx);
            idx += 1;
          }
          if (note !== -1 || inst !== -1 || vol !== -1 || efftype !== 0 || effparam !== 0) {
            row[k] = {
              notedata: [
                {
                  columnindex: 0,
                  note,
                  instrument: inst,
                  volume: vol,
                  fxtype: efftype,
                  fxparam: effparam,
                },
              ],
            };
          }
        }
        newSong.patterns[i].rows.push(row);
      }
    }

    newSong.instruments = [];
    // now load instruments
    for (let i = 0; i < ninst; i += 1) {
      const hdrsiz = dv.getUint32(idx, true);
      const instname = this.getstring(dv, idx + 0x4, 22);
      const nsamp = dv.getUint16(idx + 0x1b, true);
      const inst = {
        name: instname,
        number: i,
      };
      if (nsamp > 0) {
        const samplemap = new Uint8Array(arrayBuf, idx + 33, 96);

        const envNVol = dv.getUint8(idx + 225);
        const envVolType = dv.getUint8(idx + 233);
        let envVolSustain = dv.getUint8(idx + 227);
        const envVolLoopStart = dv.getUint8(idx + 228);
        const envVolLoopEnd = dv.getUint8(idx + 229);
        const envNPan = dv.getUint8(idx + 226);
        const envPanType = dv.getUint8(idx + 234);
        let envPanSustain = dv.getUint8(idx + 230);
        const envPanLoopStart = dv.getUint8(idx + 231);
        const envPanLoopEnd = dv.getUint8(idx + 232);
        const volFadeout = dv.getUint16(idx + 239, true);

        inst.fadeout = volFadeout;
        const envVol = [];
        for (let j = 0; j < envNVol * 2; j += 1) {
          envVol.push(dv.getUint16(idx + 129 + (j * 2), true));
        }
        const envPan = [];
        for (let j = 0; j < envNPan * 2; j += 1) {
          envPan.push(dv.getUint16(idx + 177 + (j * 2), true));
        }
        // FIXME: ignoring keymaps for now and assuming 1 sample / instrument
        // var keymap = getarray(dv, idx+0x21);
        const samphdrsiz = dv.getUint32(idx + 0x1d, true);
        console.log("hdrsiz %d; instrument %s: '%s' %d samples, samphdrsiz %d",
          hdrsiz, (i + 1).toString(16), instname, nsamp, samphdrsiz);
        idx += hdrsiz;
        let totalsamples = 0;
        const samps = [];
        for (let j = 0; j < nsamp; j += 1) {
          const samplen = dv.getUint32(idx, true);
          const samploop = dv.getUint32(idx + 4, true);
          const samplooplen = dv.getUint32(idx + 8, true);
          const sampvol = dv.getUint8(idx + 12);
          const sampfinetune = dv.getInt8(idx + 13);
          let samptype = dv.getUint8(idx + 14);
          const samppan = dv.getUint8(idx + 15);
          const sampnote = dv.getInt8(idx + 16);
          const sampname = this.getstring(dv, idx + 18, 22);
          const sampleoffset = totalsamples;
          if (samplooplen === 0) {
            samptype &= ~3;
          }
          console.log("sample %d: len %d name '%s' loop %d/%d vol %d offset %s",
            j, samplen, sampname, samploop, samplooplen, sampvol, sampleoffset.toString(16));
          console.log('           type %d note %s(%d) finetune %d pan %d',
            samptype, this.prettifyNote(sampnote + (12 * 4)), sampnote, sampfinetune, samppan);
          console.log('           vol env', envVol, envVolSustain,
            envVolLoopStart, envVolLoopEnd, 'type', envVolType,
            'fadeout', volFadeout);
          console.log('           pan env', envPan, envPanSustain,
            envPanLoopStart, envPanLoopEnd, 'type', envPanType);
          const samp = {
            len: samplen,
            loop: samploop,
            looplen: samplooplen,
            note: sampnote,
            fine: sampfinetune,
            pan: samppan,
            type: samptype,
            vol: sampvol,
            fileoffset: sampleoffset,
            name: sampname,
          };
          // length / pointers are all specified in bytes; fixup for 16-bit samples
          samps.push(samp);
          idx += samphdrsiz;
          totalsamples += samplen;
        }
        for (let j = 0; j < nsamp; j += 1) {
          const samp = samps[j];
          samp.sampledata = this.ConvertSample(
            new Uint8Array(arrayBuf, idx + samp.fileoffset, samp.len), samp.type & 16
          );
          if (samp.type & 16) {
            samp.len /= 2;
            samp.loop /= 2;
            samp.looplen /= 2;
          }
        }
        idx += totalsamples;
        inst.samplemap = samplemap;
        inst.samples = samps;
        if (envVolType) {
          if (!(envVolType & 2)) {  // if there's no sustain point, create one
            envVolSustain = envVol.length / 2;
          }
          inst.env_vol = {
            points: envVol,
            type: envVolType,
            sustain: envVolSustain,
            loopstart: envVolLoopStart,
            loopend: envVolLoopEnd,
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
        if (envPanType) {
          if (!(envPanType & 2)) {  // if there's no sustain point, create one
            envPanSustain = (envPan.length / 2) - 1;
          }
          inst.env_pan = {
            points: envPan,
            type: envPanType,
            sustain: envPanSustain,
            loopstart: envPanLoopStart,
            loopend: envPanLoopEnd,
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
        console.log('empty instrument', i, hdrsiz, idx);
      }
      newSong.instruments.push(inst);
    }

    console.log(`Loaded "${newSong.name}"`);

    return newSong;
  }
}

export const xmloader = new XMLoader();
