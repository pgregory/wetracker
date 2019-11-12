import { EffectNodeBase } from './base';

export const NAME = 'Phaser';
export const TYPE = 'phaser';

function phaserEffectParameterObject() {
  return {
    type: TYPE,
    bypass: false,
    parameters: {
      rate: 1.2,
      depth: 0.3,
      feedback: 0.2,
      stereoPhase: 30,
      baseModulationFrequency: 700,
    },
  };
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

export { PhaserEffectNode as Node, phaserEffectParameterObject as parameterObject };
