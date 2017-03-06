import $ from 'jquery';

import meterTemplate from './templates/meter.marko';

import { connect } from '../../utils/signal';
import { player } from '../../audio/player';

import './styles.css';

export default class Tabs {
  constructor(target) {
    this.target = target;
  }

  render() {
    $(this.target).append(meterTemplate.renderToString());

    this.canvas = $(this.target).find('canvas#meter').get(0);
    const width = $(this.target).width();
    const height = $(this.target).height();

    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = width;
    this.canvas.height = height;

    this.litCanvas = this.drawMeterImage(width, height, '#00FF00', '#FFA500', '#FF0000');
    this.darkCanvas = this.drawMeterImage(width, height, '#003F00', '#3F2900', '#3F0000');

    this.drawMeter({ volume: [0, 0], clipping: false });

    connect(player, 'outputChanged', this, 'onOutputChanged');
  }

  drawMeterImage(width, height, green, orange, red) {
    const imageCanvas = document.createElement('canvas');
    imageCanvas.width = width;
    imageCanvas.height = height;
    const ctx = imageCanvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = green;
    const barWidth = (width / 100) * 0.8;
    const gapWidth = (width / 100) * 0.2;
    for (let i = 0; i < 50; i += 1) {
      ctx.fillRect(i * (barWidth + gapWidth), 0, barWidth, height);
    }
    ctx.fillStyle = orange;
    for (let i = 50; i < 80; i += 1) {
      ctx.fillRect(i * (barWidth + gapWidth), 0, barWidth, height);
    }
    ctx.fillStyle = red;
    for (let i = 80; i < 100; i += 1) {
      ctx.fillRect(i * (barWidth + gapWidth), 0, barWidth, height);
    }
    return imageCanvas;
  }

  onOutputChanged(volume) {
    this.drawMeter(volume);
  }

  drawMeter(data) {
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);
    const topMargin = height * 0.2;
    const barHeight = height * 0.2;
    const space = height * 0.2;
    const nextBar = topMargin + space + barHeight;

    if (data.volume[0] > 0) {
      this.ctx.drawImage(this.litCanvas, 0, topMargin, width * data.volume[0], barHeight, 0, topMargin, width * data.volume[0], barHeight);
    }
    if (data.volume[1] > 0) {
      this.ctx.drawImage(this.litCanvas, 0, nextBar, width * data.volume[1], barHeight, 0, nextBar, width * data.volume[1], barHeight);
    }
    if (data.volume[0] < 1.0) {
      this.ctx.drawImage(this.darkCanvas, width * data.volume[0], topMargin, width * (1 - data.volume[0]), barHeight, width * data.volume[0], topMargin, width * (1 - data.volume[0]), barHeight);
    }
    if (data.volume[1] < 1.0) {
      this.ctx.drawImage(this.darkCanvas, width * data.volume[1], nextBar, width * (1 - data.volume[1]), barHeight, width * data.volume[1], nextBar, width * (1 - data.volume[1]), barHeight);
    }

    if (data.clipping) {
      $(this.target).find('.clipping').addClass('clipped');
    } else {
      $(this.target).find('.clipping').removeClass('clipped');
    }
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }
}
