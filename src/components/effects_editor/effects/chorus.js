import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { EffectUIBase } from './base';

import template from './templates/chorus.marko';

class ChorusEffectUI extends EffectUIBase {
  render() {
    this.panel = $(template.renderToString({ location: this.location }));
    $(this.target).append(this.panel);
    this.bindParameterToUI('#rate-slider', '#rate-value', 0.01, 8, 0.01, 'rate');
    this.bindParameterToUI('#feedback-slider', '#feedback-value', 0, 1, 0.001, 'feedback');
    this.bindParameterToUI('#delay-slider', '#delay-value', 0, 1, 0.001, 'delay');
    this.bindBypass();
  }
}

export { ChorusEffectUI as UI };
