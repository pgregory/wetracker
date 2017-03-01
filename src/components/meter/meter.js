import $ from 'jquery';

import meterTemplate from './templates/meter.marko';

import { signal, connect } from '../../utils/signal';
import { player } from '../../audio/player';

import './styles.css';

export default class Tabs {
  constructor(target) {
    this.target = target;
  }

  render() {
    $(this.target).append(meterTemplate.renderToString());

    this.canvas = $(this.target).find("canvas#meter").get(0);
    this.canvas.width = $(this.target).width();
    this.canvas.height = $(this.target).height();

    this.drawMeter(0.7);

    connect(player, "outputChanged", this, "onOutputChanged");
  }

  onOutputChanged(volume) {
    this.drawMeter(volume);
  }

  drawMeter(data) {
    const ctx = this.canvas.getContext("2d");

    let width = this.canvas.width;
    let height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);
    if (!data.clipping) {
      ctx.fillStyle = "green";
    } else {
      ctx.fillStyle = "red";
    }
    ctx.fillRect(0,0, width * data.volume, height);
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }
}
