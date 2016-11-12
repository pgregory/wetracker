/**
*
* MusicPlayer
*
*/

import React from 'react';
import Tone from 'tone';


class MusicPlayer extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);

    this.synth = new Tone.PolySynth(6, Tone.Synth).toMaster();

    this.synth.set({
      oscillator: {
        type: 'sine',
        modulationFrequency: 0.2,
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.2,
        release: 0.9,
      },
    });

    Tone.Transport.bpm.value = 132;
    Tone.Transport.start();

    // play a note every quarter-note
    const that = this;
    this.loop = new Tone.Sequence((time, row) => {
      let t;
      for (t = 0; t < that.props.song.patterns[0].trackdata.length; t += 1) {
        const event = that.props.song.patterns[0].trackdata[t][row];
        if (event.note) {
          that.synth.triggerAttackRelease(event.note, '4n', time);
        }
      }
    }, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
        16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
        32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
        48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
       ], '16n');
    this.loop.loop = true;

    // this.loop.start();
  }

  componentDidUpdate() {
    if (this.props.transport.playing) {
      this.loop.start();
    } else {
      this.loop.stop();
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
  // song: React.PropTypes.object.isRequired,
  transport: React.PropTypes.object.isRequired,
};

export default MusicPlayer;
