import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { EffectUIBase } from './base';
import * as fx from '../../../audio/effects/filter';

import template from './templates/filter.marko';

class FilterEffectUI extends EffectUIBase {
  render() {
    this.panel = $(template.renderToString({ location: this.location }));
    $(this.target).append(this.panel);
    this.bindParameterToUI('#freq-slider', '#freq-value', 20, 22050, 1, 'frequency');
    this.bindParameterToUI('#Q-slider', '#Q-value', 0.001, 100, 0.001, 'Q');
    this.bindParameterToUI('#gain-slider', '#gain-value', -40, 40, 0.1, 'gain');
    this.panel.find('#filter-type').on('change', (e) => {
      this.effect.parameters.filterType = $(e.target).val();
      this.effectChanged(this.location, this.effect);
    }).val(this.effect.parameters.filterType);
    this.bindBypass();
  }
}

export { FilterEffectUI as UI, fx };
