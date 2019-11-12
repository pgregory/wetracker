import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { EffectUIBase } from './base';

import template from './templates/wahwah.marko';

class WahWahEffectUI extends EffectUIBase {
  render() {
    this.panel = $(template.renderToString({ location: this.location }));
    $(this.target).append(this.panel);
    this.bindParameterToUI('#base-slider', '#base-value', 0, 1, 0.001, 'baseFrequency');
    this.bindParameterToUI('#excursion-slider', '#excursion-value', 1, 6, 1, 'excursionOctaves');
    this.bindParameterToUI('#sweep-slider', '#sweep-value', 0, 1, 0.001, 'sweep');
    this.bindParameterToUI('#resonance-slider', '#resonance-value', 1, 100, 0.1, 'resonance');
    this.bindParameterToUI('#sensitivity-slider', '#sensitivity-value', -1, 1, 0.001, 'sensitivity');
    this.panel.find('#automode').on('change', (e) => {
      this.effect.parameters.automode = e.target.checked;
      this.effectChanged(this.location, this.effect);
    }).prop('checked', this.effect.parameters.automode);
    this.bindBypass();
  }
}

export { WahWahEffectUI as UI };
