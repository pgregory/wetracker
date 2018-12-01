import { EffectNodeBase } from './base';

export const NAME = 'Overdrive';
export const TYPE = 'overdrive';

function overdriveEffectParameterObject() {
  return {
    type: TYPE,
    bypass: false,
    parameters: {
      outputGain: 0.5,
      drive: 0.7,
      curveAmount: 1,
      algorithmIndex: 0,
    },
  };
}


class OverdriveEffectNode extends EffectNodeBase {
  constructor(tuna, po) {
    super(tuna, po);

    this.fx = new tuna.Overdrive({
      outputGain: po.parameters.outputGain,
      drive: po.parameters.drive,
      curveAmount: po.parameters.curveAmount,
      algorithmIndex: po.parameters.algorithmIndex,
      bypass: po.bypass,
    });
  }

  updateFromParameterObject(po) {
    this.fx.bypass = po.bypass;
    this.fx.outputGain = po.parameters.outputGain;
    this.fx.drive = po.parameters.drive;
    this.fx.curveAmount = po.parameters.curveAmount;
    this.fx.algorithmIndex = po.parameters.algorithmIndex;
  }
}

export { OverdriveEffectNode as Node, overdriveEffectParameterObject as parameterObject };
