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

  render() {
    $(this.target).append(template.renderToString());
    let rateSlider = $("#rate-slider").slider({
      min: 0.01,
      max: 8,
      step: 0.01,
      value: this.effect.parameters.rate,
      slide: (event, ui) => {
        $("#rate-value").val(ui.value);
        this.effect.parameters.rate = ui.value;
        this.effectChanged(this.location, this.effect);
      }
    });
    $("#rate-value").on("change", (e) => {
      rateSlider.slider("value", $(e.target).val());
      this.effect.parameters.rate = $(e.target).val();
      this.effectChanged(this.location, this.effect);
    });
    let feedbackSlider = $("#feedback-slider").slider({
      min: 0,
      max: 1,
      step: 0.001,
      value: this.effect.parameters.feedback,
      slide: (event, ui) => {
        $("#feedback-value").val(ui.value);
        this.effect.parameters.feedback = ui.value;
        this.effectChanged(this.location, this.effect);
      }
    });
    $("#feedback-value").on("change", (e) => {
      feedbackSlider.slider("value", $(e.target).val());
      this.effect.parameters.feedback = $(e.target).val();
      this.effectChanged(this.location, this.effect);
    });
    let delaySlider = $("#delay-slider").slider({
      min: 0,
      max: 1,
      step: 0.001,
      value: this.effect.parameters.delay,
      slide: (event, ui) => {
        $("#delay-value").val(ui.value);
        this.effect.parameters.delay = ui.value;
        this.effectChanged(this.location, this.effect);
      }
    });
    $("#delay-value").on("change", (e) => {
      delaySlider.slider("value", $(e.target).val());
      this.effect.parameters.delay = $(e.target).val();
      this.effectChanged(this.location, this.effect);
    });
    $("#bypass").on("change", (e) => {
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
