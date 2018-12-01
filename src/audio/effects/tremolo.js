import { EffectNodeBase } from './base';

export const NAME = 'Tremolo';
export const TYPE = 'tremolo';

function tremoloEffectParameterObject() {
  return {
    type: TYPE,
    bypass: false,
    parameters: {
      intensity: 0.3,
      rate: 4,
      stereoPhase: 0,
    },
  };
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

export { TremoloEffectNode as Node, tremoloEffectParameterObject as parameterObject };
