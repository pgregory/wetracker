export default class EnvelopeFollower {
  constructor(env) {
    this.env = env;
    this.tick = 0;
  }

  Tick(release, def, releaseval) {
    if (this.env != null && (this.env.type & 0x1) !== 0) { // eslint-disable-line no-bitwise
      const value = this.env.Get(this.tick);

      if (value != null) {
        // if we're sustaining a note, stop advancing the tick counter
        if (this.env.type & 2) {  // eslint-disable-line no-bitwise
          if (!release && this.tick >= this.env.points[this.env.sustain * 2]) {
            return this.env.points[(this.env.sustain * 2) + 1];
          }
        }

        // TODO: Need to take into account vol_fadeout when releasing.
        this.tick += 1;
        // eslint-disable-next-line no-bitwise
        if (this.env.type & 4) {  // envelope loop?
          if (this.tick >= this.env.loopend) {
            this.tick = this.env.loopstart;
          }
        }
        return value;
      }
    }

    if (release) {
      return releaseval;
    }
    return def;
  }

  reset() {
    this.tick = 0;
  }
}
