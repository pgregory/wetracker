import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import template from './templates/chorus.marko';

import Signal from '../../../utils/signal';

export class ChorusEffectUI {
  constructor(target, effect, location) {
    this.target = target;
    this.effect = effect;
    this.location = location;

    this.effectChanged = Signal.signal(false);
  }

  bindParameterToUI(element, textElement, min, max, step, paramName) {
    let paramSlider = this.panel.find(element).slider({
      min,
      max,
      step,
      value: this.effect.parameters[paramName],
      slide: (event, ui) => {
        this.panel.find(textElement).val(ui.value);
        this.effect.parameters[paramName] = ui.value;
        this.effectChanged(this.location, this.effect);
      }
    });
    this.panel.find(textElement).on("change", (e) => {
      paramSlider.slider("value", $(e.target).val());
      this.effect.parameters[paramName] = $(e.target).val();
      this.effectChanged(this.location, this.effect);
    });
  }

  render() {
    this.panel = $(template.renderToString());
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

export class ChorusEffectParameterObject {
  constructor() {
    this.type = "chorus",
    this.bypass = false,
    this.parameters = {
      rate: 1.5,
      feedback: 0.2,
      delay: 0.0045,
    };
  }

  createEffectNode(tuna) {
    return new ChorusEffectNode(tuna, this);
  }
}


export class ChorusEffectNode {
  constructor(tuna, po) {
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

export let chorusEffectName = "Chorus";
export let chorusEffectType = "chorus";
