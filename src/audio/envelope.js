
export default class Envelope {
  constructor(points, type, sustain, loopstart, loopend) {
    this.points = points;
    this.type = type;
    this.sustain = sustain;
    this.loopstart = points[loopstart * 2];
    this.loopend = points[loopend * 2];
  }

  Get(ticks) {
    // TODO: optimize follower with ptr
    // or even do binary search here
    let y0 = 0;
    const env = this.points;
    for (let i = 0; i < env.length; i += 2) {
      y0 = env[i + 1];
      if (ticks < env[i]) {
        const x0 = env[i - 2];
        y0 = env[i - 1];
        const dx = env[i] - x0;
        const dy = env[i + 1] - y0;
        return y0 + ((ticks - x0) * (dy / dx));
      }
    }
    return y0;
  }
}
