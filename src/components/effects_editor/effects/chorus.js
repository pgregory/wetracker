import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { EffectUIBase, EffectParameterObjectBase, EffectNodeBase } from './base';

import template from './templates/chorus.marko';

import Signal from '../../../utils/signal';

export const NAME = "Chorus";
export const TYPE = "chorus";

class ChorusEffectUI extends EffectUIBase {
  constructor(target, effect, location) {
    super(target, effect, location);
  }

  render() {
    this.panel = $(template.renderToString({location: this.location }));
    $(this.target).append(this.panel);
    this.bindParameterToUI("#rate-slider", "#rate-value", 0.01, 8, 0.01, "rate");
    this.bindParameterToUI("#feedback-slider", "#feedback-value", 0, 1, 0.001, "feedback");
    this.bindParameterToUI("#delay-slider", "#delay-value", 0, 1, 0.001, "delay");
    this.panel.find("#bypass").on("change", (e) => {
      this.effect.bypass = !e.target.checked;
      this.effectChanged(this.location, this.effect);
    });
  }

}

class ChorusEffectParameterObject extends EffectParameterObjectBase {
  constructor() {
    super();

    this.type = TYPE,
    this.bypass = false,
    this.parameters = {
      rate: 1.5,
      feedback: 0.2,
      delay: 0.0045,
    };
  }
}

class ChorusEffectNode extends EffectNodeBase {
  constructor(tuna, po) {
    super(tuna, po);

    this.fx = new tuna.Chorus({
      rate: po.parameters.rate,
      feedback: po.parameters.feedback,
      delay: po.parameters.delay,
      bypass: po.bypass,
    });
  }

  updateFromParameterObject(po) {
    this.fx.bypass = po.bypass;
    this.fx.delay = po.parameters.delay;
    this.fx.rate = po.parameters.rate;
    this.fx.feedback = po.parameters.feedback;
  }
}

export { ChorusEffectUI as UI, ChorusEffectNode as Node, ChorusEffectParameterObject as ParameterObject }
