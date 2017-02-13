import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { EffectUIBase, EffectParameterObjectBase, EffectNodeBase } from './base';

import template from './templates/phaser.marko';

import Signal from '../../../utils/signal';

class PhaserEffectUI extends EffectUIBase {
  constructor(target, effect, location) {
    super(target, effect, location);
  }

  render() {
    this.panel = $(template.renderToString());
    $(this.target).append(this.panel);
    this.bindParameterToUI("#rate-slider", "#rate-value", 0.01, 8, 0.01, "rate");
    this.bindParameterToUI("#feedback-slider", "#feedback-value", 0, 1, 0.001, "feedback");
    this.bindParameterToUI("#depth-slider", "#depth-value", 0, 1, 0.001, "depth");
    this.bindParameterToUI("#stereo-slider", "#stereo-value", 0, 180, 1, "stereoPhase");
    this.bindParameterToUI("#base-slider", "#base-value", 500, 1500, 1, "baseModulationFrequency");
    this.panel.find("#bypass").on("change", (e) => {
      this.effect.bypass = !e.target.checked;
      this.effectChanged(this.location, this.effect);
    });
  }

}

class PhaserEffectParameterObject extends EffectParameterObjectBase {
  constructor() {
    super();

    this.type = "phaser",
    this.bypass = false,
    this.parameters = {
      rate: 1.2,
      depth: 0.3,
      feedback: 0.2,
      stereoPhase: 30,
      baseModulationFrequency: 700,
    };
  }

  createEffectNode(tuna) {
    return new PhaserEffectNode(tuna, this);
  }
}


class PhaserEffectNode extends EffectNodeBase {
  constructor(tuna, po) {
    super(tuna, po);

    this.fx = new tuna.Phaser({
      rate: po.parameters.rate,
      depth: po.parameters.depth,
      feedback: po.parameters.feedback,
      stereoPhase: po.parameters.stereoPhase,
      baseModulationFrequency: po.parameters.baseModulationFrequency,
      bypass: po.bypass,
    });
  }

  updateFromParameterObject(po) {
    this.fx.bypass = po.bypass;
    this.fx.feedback = po.parameters.feedback;
    this.fx.depth = po.parameters.depth;
    this.fx.rate = po.parameters.rate;
    this.fx.stereoPhase = po.parameters.stereoPhase;
    this.fx.baseModulationFrequency = po.parameters.baseModulationFrequency;
  }
}

export const NAME = "Phaser";
export const TYPE = "phaser";
export { PhaserEffectUI as UI, PhaserEffectNode as Node, PhaserEffectParameterObject as ParameterObject }
