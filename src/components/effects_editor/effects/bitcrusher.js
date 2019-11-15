import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { EffectUIBase } from './base';
import * as fx from '../../../audio/effects/bitcrusher';

import template from './templates/bitcrusher.marko';

class BitCrusherEffectUI extends EffectUIBase {
  render() {
    this.panel = $(template.renderToString({ location: this.location }));
    $(this.target).append(this.panel);
    this.bindParameterToUI('#bits-slider', '#bits-value', 1, 16, 1, 'bits');
    this.bindParameterToUI('#normfreq-slider', '#normfreq-value', 0, 1, 0.001, 'normfreq');
    this.bindParameterToUI('#buffer-slider', '#buffer-value', 256, 16384, 1, 'bufferSize');
    this.bindBypass();
  }
}

export { BitCrusherEffectUI as UI, fx };
