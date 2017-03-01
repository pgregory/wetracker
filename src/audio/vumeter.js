export default class AudioMeter {
  constructor(audioContext, clipLevel, averaging, clipLag) {
    this.processor = audioContext.createScriptProcessor(512);
    this.processor.onaudioprocess = this.volumeAudioProcess.bind(this);
    this.clipping = false;
    this.lastClip = 0;
    this.volume = 0;
    this.peak = 0;
    this.clipLevel = clipLevel || 0.98;
    this.averaging = averaging || 0.85;
    this.clipLag = clipLag || 750;

    this.processor.connect(audioContext.destination);
  }

  connect(target) {
    this.processor.connect(target);
  }

  checkClipping() {
    if (!this.clipping)
      return false;
    if ((this.lastClip + this.clipLag) < window.performance.now())
      this.clipping = false;
    return this.clipping;
  }

  shutdown() {
    this.processor.disconnect();
    this.processor.onaudioprocess = null;
  }

  volumeAudioProcess(event) {
    let buf = event.inputBuffer.getChannelData(0);
    let bufLength = buf.length;
    let sum = 0;
    let x;
    let mx;
    let peak = 0;

    // Do a root-mean-square on the samples: sum up the squares...
    for (var i = 0; i < bufLength; i++) {
      x = buf[i];
      mx = Math.abs(x);
      if (mx >= this.clipLevel) {
        this.clipping = true;
        this.lastClip = window.performance.now();
      }
      peak = Math.max(peak, mx);
      sum += x * x;
    }

    // ... then take the square root of the sum.
    var rms =  Math.sqrt(sum / bufLength);

    // Now smooth this out with the averaging factor applied
    // to the previous sample - take the max here because we
    // want "fast attack, slow release."
    this.volume = Math.max(rms, this.volume * this.averaging);
    this.peak = Math.max(peak, this.peak * this.averaging);
  }
}

