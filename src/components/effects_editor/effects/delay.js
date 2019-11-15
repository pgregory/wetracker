import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { EffectUIBase } from './base';
import * as fx from '../../../audio/effects/delay';

import template from './templates/delay.marko';

class DelayEffectUI extends EffectUIBase {
  render() {
    this.panel = $(template.renderToString({ location: this.location }));
    $(this.target).append(this.panel);
    this.bindParameterToUI('#delay-slider', '#delay-value', 1, 10000, 1, 'delay');
    this.bindParameterToUI('#feedback-slider', '#feedback-value', 0, 1, 0.001, 'feedback');
    this.bindParameterToUI('#wet-slider', '#wet-value', 0, 1, 0.001, 'wet');
    this.bindParameterToUI('#dry-slider', '#dry-value', 0, 1, 0.001, 'dry');
    this.bindParameterToUI('#cutoff-slider', '#cutoff-value', 20, 22050, 1, 'cutoff');
    this.bindBypass();
  }
}

export { DelayEffectUI as UI, fx };
