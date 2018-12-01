import { EffectNodeBase } from './base';

export const NAME = 'WahWah';
export const TYPE = 'wahwah';

function wahWahEffectParameterObject() {
  return {
    type: TYPE,
    bypass: false,
    parameters: {
      automode: true,
      baseFrequency: 0.5,
      excursionOctaves: 2,
      sweep: 0.2,
      resonance: 10,
      sensitivity: 0.5,
    },
  };
}


class WahWahEffectNode extends EffectNodeBase {
  constructor(tuna, po) {
    super(tuna, po);

    this.fx = new tuna.WahWah({
      automode: po.parameters.automode,
      baseFrequency: po.parameters.baseFrequency,
      excursionOctaves: po.parameters.excursionOctaves,
      sweep: po.parameters.sweep,
      resonance: po.parameters.resonance,
      sensitivity: po.parameters.sensitivity,
      bypass: po.bypass,
    });
  }

  updateFromParameterObject(po) {
    this.fx.bypass = po.bypass;
    this.fx.automode = po.parameters.automode;
    this.fx.baseFrequency = po.parameters.baseFrequency;
    this.fx.excursionOctaves = po.parameters.excursionOctaves;
    this.fx.sweep = po.parameters.sweep;
    this.fx.resonance = po.parameters.resonance;
    this.fx.sensitivity = po.parameters.sensitivity;
  }
}

export { WahWahEffectNode as Node, wahWahEffectParameterObject as parameterObject };
