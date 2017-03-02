import { signal } from '../utils/signal';

export default class AudioMeter {
  constructor(audioContext, clipLevel, averaging, clipLag) {
    this.processor = audioContext.createScriptProcessor(512);
    this.processor.onaudioprocess = this.volumeAudioProcess.bind(this);
    this.clipping = false;
    this.lastClip = 0;
    this.volume = [0, 0];
    this.peak = [0, 0];
    this.clipLevel = clipLevel || 0.98;
    this.averaging = averaging || 0.85;
    this.clipLag = clipLag || 750;

    this.vuChanged = signal(false);

    this.processor.connect(audioContext.destination);
  }

  connect(target) {
    this.processor.connect(target);
  }

  checkClipping() {
    if (!this.clipping) {
      return false;
    }
    if ((this.lastClip + this.clipLag) < window.performance.now()) {
      this.clipping = false;
    }
    return this.clipping;
  }

  shutdown() {
    this.processor.disconnect();
    this.processor.onaudioprocess = null;
  }

  volumeAudioProcess(event) {
    const buf = event.inputBuffer;
    let x;
    let mx;

    // Do a root-mean-square on the samples: sum up the squares...
    for (let b = 0; b < buf.numberOfChannels; b += 1) {
      const inputData = buf.getChannelData(b);
      const length = inputData.length;
      let sum = 0;
      let peak = 0;
      for (let i = 0; i < length; i += 1) {
        x = inputData[i];
        mx = Math.abs(x);
        if (mx >= this.clipLevel) {
          this.clipping = true;
          this.lastClip = window.performance.now();
        }
        peak = Math.max(peak, mx);
        sum += x * x;
      }
      // ... then take the square root of the sum.
      const rms = Math.sqrt(sum / length);

      // Now smooth this out with the averaging factor applied
      // to the previous sample - take the max here because we
      // want "fast attack, slow release."
      this.volume[b] = Math.max(rms, this.volume[b] * this.averaging);
      this.peak[b] = Math.max(peak, this.peak[b] * this.averaging);

      if (this.peak.every((a) => a > 0) || this.volume.every((a) => a > 0)) {
        this.vuChanged();
      }
    }
  }
}

