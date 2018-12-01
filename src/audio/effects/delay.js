import { EffectNodeBase } from './base';

export const NAME = 'Delay';
export const TYPE = 'delay';

function delayEffectParameterObject() {
  return {
    type: TYPE,
    bypass: false,
    parameters: {
      delay: 150,
      feedback: 0.45,
      wet: 0.25,
      dry: 1.0,
      cutoff: 2000,
    },
  };
}


class DelayEffectNode extends EffectNodeBase {
  constructor(tuna, po) {
    super(tuna, po);

    this.fx = new tuna.Delay({
      feedback: po.parameters.feedback,
      delayTime: po.parameters.delay,
      wetLevel: po.parameters.wet,
      dryLevel: po.parameters.dry,
      cutoff: po.parameters.cutoff,
      bypass: po.bypass,
    });
  }

  updateFromParameterObject(po) {
    this.fx.bypass = po.bypass;
    this.fx.feedback = po.parameters.feedback;
    this.fx.delayTime = po.parameters.delay;
    this.fx.wetLevel = po.parameters.wet;
    this.fx.dryLevel = po.parameters.dry;
    this.fx.cutoff = po.parameters.cutoff;
  }
}

export { DelayEffectNode as Node, delayEffectParameterObject as parameterObject };
