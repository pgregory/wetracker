import { EffectNodeBase } from './base';

export const NAME = 'BitCrusher';
export const TYPE = 'bitcrusher';

function bitCrusherEffectParameterObject() {
  return {
    type: TYPE,
    bypass: false,
    parameters: {
      bits: 4,
      normfreq: 0.1,
      bufferSize: 256,
    },
  };
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

export { BitCrusherEffectNode as Node, bitCrusherEffectParameterObject as parameterObject };
