import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { EffectUIBase, EffectParameterObjectBase, EffectNodeBase } from './base';

import template from './templates/tremolo.marko';

import Signal from '../../../utils/signal';

export const NAME = "Tremolo";
export const TYPE = "tremolo";

class TremoloEffectUI extends EffectUIBase {
  constructor(target, effect, location) {
    super(target, effect, location);
  }

  render() {
    this.panel = $(template.renderToString());
    $(this.target).append(this.panel);
    this.bindParameterToUI("#intensity-slider", "#intensity-value", 0, 1, 0.01, "intensity");
    this.bindParameterToUI("#rate-slider", "#rate-value", 0.001, 8, 0.001, "rate");
    this.bindParameterToUI("#stereo-slider", "#stereo-value", 0, 180, 0.1, "stereoPhase");
    this.panel.find("#bypass").on("change", (e) => {
      this.effect.bypass = !e.target.checked;
      this.effectChanged(this.location, this.effect);
    });
  }

}

class TremoloEffectParameterObject extends EffectParameterObjectBase {
  constructor() {
    super();

    this.type = TYPE,
    this.bypass = false,
    this.parameters = {
      intensity: 0.3,
      rate: 4,
      stereoPhase: 0,
    };
  }
}

class TremoloEffectNode extends EffectNodeBase {
  constructor(tuna, po) {
    super(tuna, po);

    this.fx = new tuna.Tremolo({
      intensity: po.parameters.intensity,
      rate: po.parameters.rate,
      stereoPhase: po.parameters.stereoPhase,
      bypass: po.bypass,
    });
  }

  updateFromParameterObject(po) {
    this.fx.bypass = po.bypass;
    this.fx.intensity = po.parameters.intensity;
    this.fx.rate = po.parameters.rate;
    this.fx.stereoPhase = po.parameters.stereoPhase;
  }
}

export { TremoloEffectUI as UI, TremoloEffectNode as Node, TremoloEffectParameterObject as ParameterObject }
