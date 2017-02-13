import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { EffectUIBase, EffectParameterObjectBase, EffectNodeBase } from './base';

import template from './templates/compressor.marko';

import Signal from '../../../utils/signal';

export const NAME = "Compressor";
export const TYPE = "compressor";

class CompressorEffectUI extends EffectUIBase {
  constructor(target, effect, location) {
    super(target, effect, location);
  }

  render() {
    this.panel = $(template.renderToString());
    $(this.target).append(this.panel);
    this.bindParameterToUI("#threshold-slider", "#threshold-value", -100, 0, 0.1, "threshold");
    this.bindParameterToUI("#makeup-slider", "#makeup-value", 0, 12, 0.1, "makeupGain");
    this.bindParameterToUI("#attack-slider", "#attack-value", 0, 1000, 1, "attack");
    this.bindParameterToUI("#release-slider", "#release-value", 0, 1000, 1, "release");
    this.bindParameterToUI("#ratio-slider", "#ratio-value", 1, 20, 0.1, "ratio");
    this.bindParameterToUI("#knee-slider", "#knee-value", 0, 40, 0.1, "knee");
    this.panel.find("#automakeup").on("change", (e) => {
      this.effect.parameters.automakeup = e.target.checked;
      this.effectChanged(this.location, this.effect);
    });
    this.panel.find("#bypass").on("change", (e) => {
      this.effect.bypass = !e.target.checked;
      this.effectChanged(this.location, this.effect);
    });
  }

}

class CompressorEffectParameterObject extends EffectParameterObjectBase {
  constructor() {
    super();

    this.type = TYPE,
    this.bypass = false,
    this.parameters = {
      threshold: -1,
      makeupGain: 1,
      attack: 1,
      release: 0,
      ratio: 4,
      knee: 5,
      automakeup: true,
    };
  }

  createEffectNode(tuna) {
    return new CompressorEffectNode(tuna, this);
  }
}


class CompressorEffectNode extends EffectNodeBase {
  constructor(tuna, po) {
    super(tuna, po);

    this.fx = new tuna.Compressor({
      threshold: po.parameters.threshold,
      makeupGain: po.parameters.makeupGain,
      attack: po.parameters.attack,
      release: po.parameters.release,
      ratio: po.parameters.ratio,
      knee: po.parameters.knee,
      automakeup: po.parameters.automakeup,
      bypass: po.bypass,
    });
  }

  updateFromParameterObject(po) {
    this.fx.bypass = po.bypass;
    this.fx.threshold = po.parameters.threshold;
    this.fx.makeupGain = po.parameters.makeupGain;
    this.fx.attack = po.parameters.attack;
    this.fx.release = po.parameters.release;
    this.fx.ratio = po.parameters.ratio;
    this.fx.knee = po.parameters.knee;
    this.fx.automakeup = po.parameters.automakeup;
  }
}

export { CompressorEffectUI as UI, CompressorEffectNode as Node, CompressorEffectParameterObject as ParameterObject }
