import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import template from './templates/delay.marko';

import Signal from '../../../utils/signal';

export class DelayEffectUI {
  constructor(target, effect, location) {
    this.target = target;
    this.effect = effect;
    this.location = location;

    this.effectChanged = Signal.signal(false);
  }

  bindParameterToUI(element, textElement, min, max, step, paramName) {
    let paramSlider = $(element).slider({
      min,
      max,
      step,
      value: this.effect.parameters[paramName],
      slide: (event, ui) => {
        $(textElement).val(ui.value);
        this.effect.parameters[paramName] = ui.value;
        this.effectChanged(this.location, this.effect);
      }
    });
    $(textElement).on("change", (e) => {
      paramSlider.slider("value", $(e.target).val());
      this.effect.parameters[paramName] = $(e.target).val();
      this.effectChanged(this.location, this.effect);
    });
  }

  render() {
    $(this.target).append(template.renderToString());
    this.bindParameterToUI("#delay-slider", "#delay-value", 1, 10000, 1, "delay");
    this.bindParameterToUI("#feedback-slider", "#feedback-value", 0, 1, 0.001, "feedback");
    this.bindParameterToUI("#wet-slider", "#wet-value", 0, 1, 0.001, "wet");
    this.bindParameterToUI("#dry-slider", "#dry-value", 0, 1, 0.001, "dry");
    this.bindParameterToUI("#cutoff-slider", "#cutoff-value", 20, 22050, 1, "cutoff");
    $("#bypass").on("change", (e) => {
      this.effect.bypass = !e.target.checked;
      this.effectChanged(this.location, this.effect);
    });
  }

}

export class DelayEffectParameterObject {
  constructor() {
    this.type = "delay",
    this.bypass = false,
    this.parameters = {
      delay: 150,
      feedback: 0.45,
      wet: 0.25,
      dry: 1.0,
      cutoff: 2000,
    };
  }

  createEffectNode(tuna) {
    return new DelayEffectNode(tuna, this);
  }
}


export class DelayEffectNode {
  constructor(tuna, po) {
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

export let delayEffectName = "Delay";
export let delayEffectType = "delay";
