import { EffectNodeBase } from './base';

export const NAME = 'Compressor';
export const TYPE = 'compressor';

function compressorEffectParameterObject() {
  return {
    type: TYPE,
    bypass: false,
    parameters: {
      threshold: -1,
      makeupGain: 1,
      attack: 1,
      release: 0,
      ratio: 4,
      knee: 5,
      automakeup: true,
    },
  };
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

export { CompressorEffectNode as Node, compressorEffectParameterObject as parameterObject };
