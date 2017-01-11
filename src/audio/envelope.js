
export default class Envelope {
  constructor(points, type, sustain, loopstart, loopend) {
    this.points = points;
    this.type = type;
    this.sustain = sustain;
    this.loopstart = points[loopstart*2];
    this.loopend = points[loopend*2];
  }

  Get(ticks) {
    // TODO: optimize follower with ptr
    // or even do binary search here
    var y0 = 0;
    var env = this.points;
    for (var i = 0; i < env.length; i += 2) {
      y0 = env[i+1];
      if (ticks < env[i]) {
        var x0 = env[i-2];
        y0 = env[i-1];
        var dx = env[i] - x0;
        var dy = env[i+1] - y0;
        return y0 + (ticks - x0) * dy / dx;
      }
    }
    return y0;
  }
}

