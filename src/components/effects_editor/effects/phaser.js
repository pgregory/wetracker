import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { EffectUIBase } from './base';

import template from './templates/phaser.marko';

class PhaserEffectUI extends EffectUIBase {
  render() {
    this.panel = $(template.renderToString({ location: this.location }));
    $(this.target).append(this.panel);
    this.bindParameterToUI('#rate-slider', '#rate-value', 0.01, 8, 0.01, 'rate');
    this.bindParameterToUI('#feedback-slider', '#feedback-value', 0, 1, 0.001, 'feedback');
    this.bindParameterToUI('#depth-slider', '#depth-value', 0, 1, 0.001, 'depth');
    this.bindParameterToUI('#stereo-slider', '#stereo-value', 0, 180, 1, 'stereoPhase');
    this.bindParameterToUI('#base-slider', '#base-value', 500, 1500, 1, 'baseModulationFrequency');
    this.bindBypass();
  }
}

export { PhaserEffectUI as UI };
