import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { EffectUIBase, EffectParameterObjectBase, EffectNodeBase } from './base';

import template from './templates/filter.marko';

import Signal from '../../../utils/signal';


export const NAME = "Filter";
export const TYPE = "filter";

class FilterEffectUI extends EffectUIBase {
  constructor(target, effect, location) {
    super(target, effect, location);
  }

  render() {
    this.panel = $(template.renderToString({ location: this.location }));
    $(this.target).append(this.panel);
    this.bindParameterToUI("#freq-slider", "#freq-value", 20, 22050, 1, "frequency");
    this.bindParameterToUI("#Q-slider", "#Q-value", 0.001, 100, 0.001, "Q");
    this.bindParameterToUI("#gain-slider", "#gain-value", -40, 40, 0.1, "gain");
    this.panel.find("#filter-type").on("change", (e) => {
      this.effect.parameters.filterType = $(e.target).val();
      this.effectChanged(this.location, this.effect);
    }).val(this.effect.parameters.filterType);
    this.bindBypass();
  }

}

class FilterEffectParameterObject extends EffectParameterObjectBase {
  constructor() {
    super();

    this.type = TYPE,
    this.bypass = false,
    this.parameters = {
      frequency: 440,
      Q: 1,
      gain: 0,
      filterType: "lowpass",
    };
  }
}


class FilterEffectNode extends EffectNodeBase {
  constructor(tuna, po) {
    super(tuna, po);

    this.fx = new tuna.Filter({
      frequency: po.parameters.frequency,
      Q: po.parameters.Q,
      gain: po.parameters.gain,
      filterType: po.parameters.filterType,
      bypass: po.bypass,
    });
  }

  updateFromParameterObject(po) {
    this.fx.bypass = po.bypass;
    this.fx.frequency = po.parameters.frequency;
    this.fx.Q = po.parameters.Q;
    this.fx.gain = po.parameters.gain;
    this.fx.filterType = po.parameters.filterType;
  }
}

export { FilterEffectUI as UI, FilterEffectNode as Node, FilterEffectParameterObject as ParameterObject }
