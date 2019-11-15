import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { EffectUIBase } from './base';
import * as fx from '../../../audio/effects/compressor';

import template from './templates/compressor.marko';

class CompressorEffectUI extends EffectUIBase {
  render() {
    this.panel = $(template.renderToString({ location: this.location }));
    $(this.target).append(this.panel);
    this.bindParameterToUI('#threshold-slider', '#threshold-value', -100, 0, 0.1, 'threshold');
    this.bindParameterToUI('#makeup-slider', '#makeup-value', 0, 12, 0.1, 'makeupGain');
    this.bindParameterToUI('#attack-slider', '#attack-value', 0, 1000, 1, 'attack');
    this.bindParameterToUI('#release-slider', '#release-value', 0, 1000, 1, 'release');
    this.bindParameterToUI('#ratio-slider', '#ratio-value', 1, 20, 0.1, 'ratio');
    this.bindParameterToUI('#knee-slider', '#knee-value', 0, 40, 0.1, 'knee');
    this.panel.find('#automakeup').on('change', (e) => {
      this.effect.parameters.automakeup = e.target.checked;
      this.effectChanged(this.location, this.effect);
    }).prop('checked', this.effect.parameters.automakeup);
    this.bindBypass();
  }
}

export { CompressorEffectUI as UI, fx };
