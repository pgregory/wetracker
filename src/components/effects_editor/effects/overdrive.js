import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import { EffectUIBase, EffectParameterObjectBase, EffectNodeBase } from './base';

import template from './templates/overdrive.marko';

import Signal from '../../../utils/signal';


export const NAME = "Overdrive";
export const TYPE = "overdrive";

class OverdriveEffectUI extends EffectUIBase {
  constructor(target, effect, location) {
    super(target, effect, location);
  }

  render() {
    this.panel = $(template.renderToString({ location: this.location }));
    $(this.target).append(this.panel);
    this.bindParameterToUI("#output-slider", "#output-value", 0, 1, 0.01, "outputGain");
    this.bindParameterToUI("#drive-slider", "#drive-value", 0, 1, 0.001, "drive");
    this.bindParameterToUI("#curve-slider", "#curve-value", 0, 1, 0.001, "curveAmount");
    this.bindParameterToUI("#alg-slider", "#alg-value", 0, 5, 1, "algorithmIndex");
    this.bindBypass();
  }

}

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

export { OverdriveEffectUI as UI, OverdriveEffectNode as Node, overdriveEffectParameterObject as parameterObject }
