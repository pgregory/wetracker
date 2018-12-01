import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { EffectUIBase } from './base';

import template from './templates/overdrive.marko';

class OverdriveEffectUI extends EffectUIBase {
  render() {
    this.panel = $(template.renderToString({ location: this.location }));
    $(this.target).append(this.panel);
    this.bindParameterToUI('#output-slider', '#output-value', 0, 1, 0.01, 'outputGain');
    this.bindParameterToUI('#drive-slider', '#drive-value', 0, 1, 0.001, 'drive');
    this.bindParameterToUI('#curve-slider', '#curve-value', 0, 1, 0.001, 'curveAmount');
    this.bindParameterToUI('#alg-slider', '#alg-value', 0, 5, 1, 'algorithmIndex');
    this.bindBypass();
  }

}

export { OverdriveEffectUI as UI };
