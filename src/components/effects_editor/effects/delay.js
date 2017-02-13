import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { EffectUIBase, EffectParameterObjectBase, EffectNodeBase } from './base';

import template from './templates/delay.marko';

import Signal from '../../../utils/signal';

export const NAME = "Delay";
export const TYPE = "delay";

class DelayEffectUI extends EffectUIBase {
  constructor(target, effect, location) {
    super(target, effect, location);
  }

  render() {
    this.panel = $(template.renderToString({ location: this.location }));
    $(this.target).append(this.panel);
    this.bindParameterToUI("#delay-slider", "#delay-value", 1, 10000, 1, "delay");
    this.bindParameterToUI("#feedback-slider", "#feedback-value", 0, 1, 0.001, "feedback");
    this.bindParameterToUI("#wet-slider", "#wet-value", 0, 1, 0.001, "wet");
    this.bindParameterToUI("#dry-slider", "#dry-value", 0, 1, 0.001, "dry");
    this.bindParameterToUI("#cutoff-slider", "#cutoff-value", 20, 22050, 1, "cutoff");
    this.bindBypass();
  }

}

class DelayEffectParameterObject extends EffectParameterObjectBase {
  constructor() {
    super();

    this.type = TYPE,
    this.bypass = false,
    this.parameters = {
      delay: 150,
      feedback: 0.45,
      wet: 0.25,
      dry: 1.0,
      cutoff: 2000,
    };
  }
}


class DelayEffectNode extends EffectNodeBase {
  constructor(tuna, po) {
    super(tuna, po);

    this.fx = new tuna.Delay({
      feedback: po.parameters.feedback,
      delayTime: po.parameters.delay,
      wetLevel: po.parameters.wet,
      dryLevel: po.parameters.dry,
      cutoff: po.parameters.cutoff,
      bypass: po.bypass,
    });
  }

  updateFromParameterObject(po) {
    this.fx.bypass = po.bypass;
    this.fx.feedback = po.parameters.feedback;
    this.fx.delayTime = po.parameters.delay;
    this.fx.wetLevel = po.parameters.wet;
    this.fx.dryLevel = po.parameters.dry;
    this.fx.cutoff = po.parameters.cutoff;
  }
}

export { DelayEffectUI as UI, DelayEffectNode as Node, DelayEffectParameterObject as ParameterObject }
