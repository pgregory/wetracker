import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { player } from '../../../audio/player';

import template from './templates/chorus.marko';

export default class ChorusEffect {
  constructor(target, effect) {
    this.target = target;
    this.effect = effect;
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
        player.chorus.rate = ui.value;
      }
    });
    $("#rate-value").on("change", (e) => {
      rateSlider.slider("value", $(e.target).val());
      player.chorus.rate = $(e.target).val();
    });
    let feedbackSlider = $("#feedback-slider").slider({
      min: 0,
      max: 1,
      step: 0.001,
      value: this.effect.parameters.feedback,
      slide: (event, ui) => {
        $("#feedback-value").val(ui.value);
        player.chorus.feedback = ui.value;
      }
    });
    $("#feedback-value").on("change", (e) => {
      feedbackSlider.slider("value", $(e.target).val());
      player.chorus.feedback = $(e.target).val();
    });
    let delaySlider = $("#delay-slider").slider({
      min: 0,
      max: 1,
      step: 0.001,
      value: this.effect.parameters.delay,
      slide: (event, ui) => {
        $("#delay-value").val(ui.value);
        player.chorus.delay = ui.value;
      }
    });
    $("#delay-value").on("change", (e) => {
      delaySlider.slider("value", $(e.target).val());
      player.chorus.delay = $(e.target).val();
    });
    $("#bypass").on("change", (e) => {
      player.chorus.bypass = !e.target.checked;
    });
  }
}

