import $ from 'jquery';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import EnvelopeWidget from './envelope_widget';

import styles from './styles.css';

export default class VolumeEnvelope extends EnvelopeWidget {
  constructor(target) {
    super(target);
  }

  createEnvelope() {
    if(this.instrument) {
      this.instrument.env_vol = {
        points: [0, 64, 2, 64], 
        type: 2,
        sustain: 0,
        loopstart: 0,
        loopend: 0,
      };
    }
    this.envelope = this.instrument.env_vol;

    super.createEnvelope();
  }

  setInstrument(instrument) {
    super.setInstrument(instrument);
    this.envelope = instrument.env_vol;
  }
}
