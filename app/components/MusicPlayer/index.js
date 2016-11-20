/**
*
* MusicPlayer
*
*/

import React from 'react';
import Tone from 'tone';

import * as Tonal from 'tonal-distance';


class SynthWrapper {
  constructor(instrument) {
    this.synth = new Tone.PolySynth(6, Tone.Synth).toMaster();
    this.synth.set(instrument.data);
  }

  applyEvent(event, time) {
    this.synth.triggerAttackRelease(event.note, '16n', time);
  }
}


class MetalWrapper {
  constructor(instrument) {
    this.synth = new Tone.PolySynth(6, Tone.MetalSynth).toMaster();
    this.synth.set(instrument.data);
  }

  applyEvent(event, time) {
    this.synth.triggerAttack(time);
  }
}

class MembraneWrapper {
  constructor(instrument) {
    this.synth = new Tone.PolySynth(6, Tone.MembraneSynth).toMaster();
    this.synth.set(instrument.data);
  }

  applyEvent(event, time) {
    this.synth.triggerAttackRelease(event.note, '16n', time);
  }
}

class TracksSampler {
  constructor(instrument, tracks, destination) {
    this.samplers = [];
    for (let i = 0; i < tracks.length; i += 1) {
      const sampler = new Tone.PolySynth(6, Tone.Sampler);
      sampler.connect(destination);

      sampler.set(instrument.data);
      this.samplers.push(sampler);
    }
  }

  setBuffer(buffer) {
    let v;
    let s;
    for (s = 0; s < this.samplers.length; s += 1) {
      for (v = 0; v < 6; v += 1) {
        this.samplers[s].voices[v].player.buffer = buffer;
      }
    }
  }

  play(interval, time, track) {
    this.samplers[track].triggerAttack(interval, time);
  }
}

class SamplerWrapper {
  constructor(instrument, tracks) {
    this.samplers = [];
    this.instrument = instrument;

    const samples = new Tone.Buffers();
    for (let i = 0; i < instrument.samples.length; i += 1) {
      const sampler = new TracksSampler(instrument, tracks, Tone.Master);
      const base = instrument.samples[i].base;
      samples.add(instrument.samples[i].base,
                  instrument.samples[i].url,
                  () => {
                    let v = 0;
                    for (; v < 6; v += 1) {
                      sampler.setBuffer(samples.get(base));
                    }
                  });
      this.samplers.push(sampler);
    }
    this.samples = samples;
  }

  applyEvent(event, time, track) {
    let i;
    let sampleIndex = 0;
    const min = Tonal.semitones(event.note, this.instrument.samples[0].rangeStart);
    const max = Tonal.semitones(event.note, this.instrument.samples[this.instrument.samples.length - 1].rangeEnd);
    if (min < 0) {
      if (max < 0) {
        sampleIndex = this.instrument.samples.length - 1;
      } else {
        for (i = 0; i < this.instrument.samples.length; i += 1) {
          const bottom = Tonal.semitones(event.note, this.instrument.samples[i].rangeStart);
          const top = Tonal.semitones(event.note, this.instrument.samples[i].rangeEnd);
          if (Math.sign(bottom) !== Math.sign(top)) {
            sampleIndex = i;
            break;
          }
        }
      }
    }
    const interval = Tonal.semitones(this.instrument.samples[sampleIndex].base, event.note);

    this.samplers[sampleIndex].play(interval, time, track);
  }
}

class MusicPlayer extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);

    Tone.Transport.bpm.value = 132;
    Tone.Transport.start();

    this.instruments = props.song.instruments.map((instr) => {
      switch (instr.type) {
        case 'metal': {
          return new MetalWrapper(instr);
        }
        case 'membrane': {
          return new MembraneWrapper(instr);
        }
        case 'sampler': {
          return new SamplerWrapper(instr, this.props.song.tracks);
        }
        case 'synth':
        default: {
          return new SynthWrapper(instr);
        }
      }
    });

    // play a note every quarter-note
    this.loop = new Tone.Sequence((time, row) => {
      this.playPatternRow(time, row);
      this.props.onPlayCursorRowChange(row);
    }, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
        32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
        48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
       ], '16n');
    this.loop.loop = true;
  }

  componentDidUpdate() {
    if (this.props.transport.playing) {
      this.loop.start();
    } else {
      this.loop.stop();
    }
  }

  playPatternRow(time, row) {
    let t;
    for (t = 0; t < this.props.song.patterns[0].trackdata.length; t += 1) {
      const event = this.props.song.patterns[0].trackdata[t].notedata[row];
      if (event.notes) {
        this.playTrackEvents(event, time, t);
      }
    }
  }

  playTrackEvents(event, time, track) {
    let n;
    for (n = 0; n < event.notes.length; n += 1) {
      this.playNote(event.notes[n], time, track);
    }
  }

  playNote(note, time, track) {
    if ('note' in note && 'instrument' in note) {
      this.instruments[note.instrument].applyEvent(note, time, track);
    }
  }

  render() {
    return (
      <div>
      </div>
    );
  }
}

MusicPlayer.propTypes = {
  song: React.PropTypes.object.isRequired,
  transport: React.PropTypes.object.isRequired,
  onPlayCursorRowChange: React.PropTypes.func.isRequired,
};

export default MusicPlayer;
