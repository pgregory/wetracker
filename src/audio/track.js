import { song } from '../utils/songmanager';

import * as chorus from './effects/chorus';
import * as delay from './effects/delay';
import * as phaser from './effects/phaser';
import * as overdrive from './effects/overdrive';
import * as compressor from './effects/compressor';
import * as filter from './effects/filter';
import * as tremolo from './effects/tremolo';
import * as wahwah from './effects/wahwah';
import * as bitcrusher from './effects/bitcrusher';

const effectNodeConstructors = {
  chorus,
  delay,
  phaser,
  overdrive,
  compressor,
  filter,
  tremolo,
  wahwah,
  bitcrusher,
};

export default class Track {
  constructor(ctx, destination, songTrackIndex) {
    this.ctx = ctx;
    this.analyser = this.ctx.createAnalyser();
    this.gainNode = this.ctx.createGain();

    this.analyser.fftSize = 256;
    this.analyserBufferLength = this.analyser.frequencyBinCount;
    this.analyserScopeData = new Uint8Array(this.analyserBufferLength);
    this.analyserFreqData = new Uint8Array(this.analyserBufferLength);

    this.gainNode.gain.value = 1.0;
    this.stateStack = [];

    this.gainNode.connect(this.analyser);
    this.analyser.connect(destination);

    this.columns = [];

    for (let c = 0; c < song.getTrackNumColumns(songTrackIndex); c += 1) {
      const newColumn = {
        filterstate: new Float32Array(3),
        vol: 0,
        pan: 128,
        period: 7680 - (48 * 64),
        vL: 0,
        vR: 0,   // left right volume envelope followers (changes per sample)
        vLprev: 0,
        vRprev: 0,
        volE: 0,
        panE: 0,
        retrig: 0,
        vibratopos: 0,
        vibratodepth: 1,
        vibratospeed: 1,
        vibratotype: 0,
        gainNode: this.ctx.createGain(),
      };
      newColumn.gainNode.gain.value = 1.0;
      newColumn.gainNode.connect(this.gainNode);
      this.columns.push(newColumn);
    }

    this.effectChain = [];
  }

  updateAnalyserScopeData() {
    this.analyser.getByteTimeDomainData(this.analyserScopeData);
    this.analyser.getByteFrequencyData(this.analyserFreqData);
  }

  /* eslint-disable no-param-reassign */
  pushState(trackState) {
    if ('properties' in trackState && 'gain' in trackState.properties) {
      this.gainNode.gain.value = trackState.properties.gain;
    } else if ('properties' in trackState) {
      trackState.properties.gain = this.gainNode.gain.value;
    } else {
      trackState.properties = {
        gain: this.gainNode.gain.value,
      };
    }
    this.stateStack.push(trackState);
  }
  /* eslint-enable no-param-reassign */

  /* eslint-disable no-param-reassign */
  setState(trackState) {
    if ('properties' in trackState && 'gain' in trackState.properties) {
      this.gainNode.gain.value = trackState.properties.gain;
    } else if ('properties' in trackState) {
      trackState.properties.gain = this.gainNode.gain.value;
    } else {
      trackState.properties = {
        gain: this.gainNode.gain.value,
      };
    }
    this.stateStack[this.stateStack.length - 1] = trackState;
  }
  /* eslint-enable no-param-reassign */

  popState() {
    const trackState = this.stateStack.pop();
    this.gainNode.gain.value = this.getState().properties.gain;
    return trackState;
  }

  getState() {
    if (this.stateStack.length > 0) {
      return this.stateStack[this.stateStack.length - 1];
    }
    throw new Error('Error, track state stack is empty');
  }

  buildEffectChain(effects, tuna) {
    this.effectChain = [];
    this.gainNode.disconnect();
    for (let i = 0; i < this.effectChain.length; i += 1) {
      this.effectChain[i].disconnect();
    }
    if (effects.length > 0) {
      for (let i = 0; i < effects.length; i += 1) {
        const fx = new effectNodeConstructors[effects[i].type].Node(tuna, effects[i]);
        if (i > 0) {
          this.effectChain[i - 1].fx.connect(fx.fx);
        }
        this.effectChain.push(fx);
      }
      // Link into the node tree.
      this.gainNode.connect(this.effectChain[0].fx);
      this.effectChain[this.effectChain.length - 1].fx.connect(this.analyser);
    } else {
      this.gainNode.connect(this.analyser);
    }
  }
}
