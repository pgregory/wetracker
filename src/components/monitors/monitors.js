import $ from 'jquery';

import { connect } from '../../utils/signal';
import { song } from '../../utils/songmanager';
import { player, SILENT, MUTE } from '../../audio/player';

import monitorsTemplate from './templates/monitors.marko';

import './styles.css';

export default class Monitors {
  constructor(target) {
    this.target = target;
    this.trackNames = song.getTrackNames();
    this.scopes = [];

    connect(player, 'tracksChanged', this, 'onTracksChanged');
    connect(song, 'trackChanged', this, 'onTrackChanged');
    connect(song, 'songChanged', this, 'onSongChanged');
  }

  render() {
    $(this.target).addClass('monitors');
    const numtracks = song.getNumTracks();
    const columns = Math.ceil(numtracks / 2.0);
    $(this.target).append(monitorsTemplate.renderToString({ numtracks, columns, tracknames: this.trackNames }));

    for (let j = 0; j < numtracks; j += 1) {
      const canvas = document.getElementById(`vu${j}`);
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      this.scopes[j] = canvas;
    }

    this.resetMonitors();

    $(this.target).find('.monitor-canvas').click((e) => {
      this.clickTrack(e, $(e.target).data('trackindex'));
    });
  }

  clickTrack(e, index) {
    if (e.shiftKey) {
      this.soloTrack(index);
    } else {
      this.muteTrack(index);
    }
  }

  muteTrack(index) {
    player.toggleMuteTrack(index);
  }

  soloTrack(index) {
    player.toggleSoloTrack(index);
  }

  onTracksChanged(tracks) {
    this.renderMonitors(tracks);
  }

  onTrackChanged() {
    this.trackNames = song.getTrackNames();
    this.refresh();
  }

  resetMonitors() {
    const numtracks = song.getNumTracks();
    // update VU meters & oscilliscopes
    for (let j = 0; j < numtracks; j += 1) {
      const canvas = this.scopes[j];
      const ctx = canvas.getContext('2d', { alpha: false });

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#0f0';
      ctx.strokeStyle = '#04AEF7';
      ctx.lineWidth = 1;

      const y = canvas.height / 2;

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  renderMonitors(e) {
    const numtracks = song.getNumTracks();
    // update VU meters & oscilliscopes
    for (let j = 0; j < numtracks; j += 1) {
      const canvas = this.scopes[j];
      const ctx = canvas.getContext('2d', { alpha: false });

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if ('states' in e && j < e.states.length && [MUTE, SILENT].indexOf(e.states[j].state) !== -1) {
        let text = 'MUTE';
        let color = '#900';
        if (e.states[j].state === SILENT) {
          text = 'SILENT';
          color = '#099';
        }
        let pixelSize = 48;
        ctx.font = `${pixelSize}px monospace`;
        let size = ctx.measureText(text);
        while ((size.width > (canvas.width * 0.75))
               && (pixelSize > 8)) {
          pixelSize -= 1;
          ctx.font = `${pixelSize}px monospace`;
          size = ctx.measureText(text);
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = color;
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      } else {
        ctx.fillStyle = '#0f0';
        ctx.strokeStyle = '#04AEF7';
        ctx.lineWidth = 1;

        // volume in dB as a green bar
        // var vu_y = -Math.log(e.vu[j])*10;
        // ctx.fillRect(10, vu_y, 5, canvas.height-vu_y);

        const cho2 = canvas.height / 2;

        if ('scopes' in e && j < e.scopes.length && 'scopeData' in e.scopes[j]) {
          const { scopeData } = e.scopes[j];
          const { bufferLength } = e.scopes[j];

          const sliceWidth = canvas.width * (1.0 / (bufferLength - 1));
          let x = 0;
          let y = (scopeData[0] / 128.0) * cho2;

          ctx.beginPath();
          ctx.moveTo(x, y);
          for (let i = 1; i < bufferLength; i += 1) {
            y = (scopeData[i] / 128.0) * cho2;
            ctx.lineTo(x, y);
            x += sliceWidth;
          }
          ctx.stroke();
        }
      }
    }
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }

  onSongChanged() {
    this.trackNames = song.getTrackNames();
    this.refresh();
  }
}
