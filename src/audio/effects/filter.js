import { EffectNodeBase } from './base';

export const NAME = 'Filter';
export const TYPE = 'filter';

function filterEffectParameterObject() {
  return {
    type: TYPE,
    bypass: false,
    parameters: {
      frequency: 440,
      Q: 1,
      gain: 0,
      filterType: 'lowpass',
    },
  };
}


class FilterEffectNode extends EffectNodeBase {
  constructor(tuna, po) {
    super(tuna, po);

    this.fx = new tuna.Filter({
      frequency: po.parameters.frequency,
      Q: po.parameters.Q,
      gain: po.parameters.gain,
      filterType: po.parameters.filterType,
      bypass: po.bypass,
    });
  }

  updateFromParameterObject(po) {
    this.fx.bypass = po.bypass;
    this.fx.frequency = po.parameters.frequency;
    this.fx.Q = po.parameters.Q;
    this.fx.gain = po.parameters.gain;
    this.fx.filterType = po.parameters.filterType;
  }
}

export { FilterEffectNode as Node, filterEffectParameterObject as parameterObject };
