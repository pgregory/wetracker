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

  setInstrument(instrument) {
    super.setInstrument(instrument);
    this.envelope = instrument.env_vol;
  }
}
