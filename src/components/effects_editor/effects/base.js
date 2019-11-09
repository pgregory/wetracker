import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { state } from '../../../state';
import { signal } from '../../../utils/signal';

export class EffectUIBase {
  constructor(target, effect, location) {
    this.target = target;
    this.effect = effect;
    this.location = location;

    this.effectChanged = signal(false);
  }

  bindParameterToUI(element, textElement, min, max, step, paramName) {
    const paramSlider = this.panel.find(element).slider({
      min,
      max,
      step,
      value: this.effect.parameters[paramName],
      start: () => {
        state.groupHistoryStart('Change effect parameter');
      },
      stop: () => {
        state.groupHistoryEnd();
      },
      slide: (event, ui) => {
        this.panel.find(textElement).val(ui.value);
        this.effect.parameters[paramName] = ui.value;
        this.effectChanged(this.location, this.effect);
      },
    });
    this.panel.find(textElement).on('change', (e) => {
      paramSlider.slider('value', $(e.target).val());
      this.effect.parameters[paramName] = $(e.target).val();
      this.effectChanged(this.location, this.effect);
    }).val(this.effect.parameters[paramName]);
  }

  bindBypass() {
    this.panel.find('#bypass').on('change', (e) => {
      this.effect.bypass = !e.target.checked;
      this.effectChanged(this.location, this.effect);
    }).prop('checked', !this.effect.bypass);
  }
}
