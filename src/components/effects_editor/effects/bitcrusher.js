import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { EffectUIBase, EffectParameterObjectBase, EffectNodeBase } from './base';

import template from './templates/bitcrusher.marko';

import Signal from '../../../utils/signal';

export const NAME = "BitCrusher";
export const TYPE = "bitcrusher";

class BitCrusherEffectUI extends EffectUIBase {
  constructor(target, effect, location) {
    super(target, effect, location);
  }

  render() {
    this.panel = $(template.renderToString());
    $(this.target).append(this.panel);
    this.bindParameterToUI("#bits-slider", "#bits-value", 1, 16, 1, "bits");
    this.bindParameterToUI("#normfreq-slider", "#normfreq-value", 0, 1, 0.001, "normfreq");
    this.bindParameterToUI("#buffer-slider", "#buffer-value", 256, 16384, 1, "bufferSize");
    this.panel.find("#bypass").on("change", (e) => {
      this.effect.bypass = !e.target.checked;
      this.effectChanged(this.location, this.effect);
    });
  }

}

class BitCrusherEffectParameterObject extends EffectParameterObjectBase {
  constructor() {
    super();

    this.type = TYPE,
    this.bypass = false,
    this.parameters = {
      bits: 4,
      normfreq: 0.1,
      bufferSize: 4096,
    };
  }
}

class BitCrusherEffectNode extends EffectNodeBase {
  constructor(tuna, po) {
    super(tuna, po);

    this.fx = new tuna.Bitcrusher({
      bits: po.parameters.bits,
      normfreq: po.parameters.normfreq,
      bufferSize: po.parameters.bufferSize,
      bypass: po.bypass,
    });
  }

  updateFromParameterObject(po) {
    this.fx.bypass = po.bypass;
    this.fx.bits = po.parameters.bits;
    this.fx.normfreq = po.parameters.normfreq;
    this.fx.bufferSize = po.parameters.bufferSize;
  }
}

export { BitCrusherEffectUI as UI, BitCrusherEffectNode as Node, BitCrusherEffectParameterObject as ParameterObject }
