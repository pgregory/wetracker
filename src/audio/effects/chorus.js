import { EffectNodeBase } from './base';

export const NAME = 'Chorus';
export const TYPE = 'chorus';

function chorusEffectParameterObject() {
  return {
    type: TYPE,
    bypass: false,
    parameters: {
      rate: 1.5,
      feedback: 0.2,
      delay: 0.0045,
    },
  };
}

class ChorusEffectNode extends EffectNodeBase {
  constructor(tuna, po) {
    super(tuna, po);

    this.fx = new tuna.Chorus({
      rate: po.parameters.rate,
      feedback: po.parameters.feedback,
      delay: po.parameters.delay,
      bypass: po.bypass,
    });
  }

  updateFromParameterObject(po) {
    this.fx.bypass = po.bypass;
    this.fx.delay = po.parameters.delay;
    this.fx.rate = po.parameters.rate;
    this.fx.feedback = po.parameters.feedback;
  }
}

export { ChorusEffectNode as Node, chorusEffectParameterObject as parameterObject };
