import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { EffectUIBase } from './base';

import template from './templates/tremolo.marko';

class TremoloEffectUI extends EffectUIBase {
  render() {
    this.panel = $(template.renderToString({ location: this.location }));
    $(this.target).append(this.panel);
    this.bindParameterToUI('#intensity-slider', '#intensity-value', 0, 1, 0.01, 'intensity');
    this.bindParameterToUI('#rate-slider', '#rate-value', 0.001, 8, 0.001, 'rate');
    this.bindParameterToUI('#stereo-slider', '#stereo-value', 0, 180, 0.1, 'stereoPhase');
    this.bindBypass();
  }

}

export { TremoloEffectUI as UI };
