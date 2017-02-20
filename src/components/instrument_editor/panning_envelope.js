import { state } from '../../state';
import { song } from '../../utils/songmanager';

import EnvelopeWidget from './envelope_widget';

export default class PanningEnvelope extends EnvelopeWidget {
  constructor(target) {
    super(target);

    this.setInstrument(state.cursor.get('instrument'));
  }

  createEnvelope() {
    if (this.instrument) {
      this.instrument.env_pan = {
        points: [0, 32, 2, 32],
        type: 2,
        sustain: 0,
        loopstart: 0,
        loopend: 0,
      };
    }
    this.envelope = this.instrument.env_pan;

    song.updateInstrument(this.instrumentIndex, this.instrument);

    super.createEnvelope();
  }

  setInstrument(instrument) {
    super.setInstrument(instrument);
    this.envelope = this.instrument.env_pan;
  }
}
