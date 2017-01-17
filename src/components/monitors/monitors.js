import $ from 'jquery';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';
import { player } from '../../audio/player';

import monitorsTemplate from './templates/monitors.marko';

import styles from './styles.css';

export default class Monitors {
  constructor(target) {
    this._scope_width = 50,
    this.target = target;

    Signal.connect(state, "tracksChanged", this, "onTracksChanged");
    Signal.connect(song, "trackChanged", this, "onTrackChanged");
    Signal.connect(song, "songChanged", this, "onSongChanged");
  }

  render() {
    $(this.target).addClass('monitors');
    var columns = Math.ceil(song.song.tracks.length / 2.0);
    $(this.target).append(monitorsTemplate.renderToString({song: song.song, columns}));

    for (var j = 0; j < song.song.tracks.length; j++) {
      var canvas = document.getElementById(`vu${j}`);
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    this.renderMonitors();

    $(this.target).find(".monitor-canvas").click((e) => {
      this.clickTrack($(e.target).data('trackindex'));
    }); 
  }

  clickTrack(index) {
    player.toggleMuteTrack(index);
  }

  onTracksChanged() {
    this.renderMonitors();
  }

  onTrackChanged() {
    this.renderMonitors();
  }

  renderTrackName(track, ctx) {
    ctx.font = "10px monospace";
    ctx.fillStyle = '#888';
    ctx.textAlign = 'start';
    ctx.textBaseline = 'top';
    ctx.fillText(track.name, 2, 2);
  }

  renderMonitors() {
    var e = state.tracks;
    // update VU meters & oscilliscopes
    for (var j = 0; j < song.song.tracks.length; j++) {
      var canvas = document.getElementById(`vu${j}`);
      var ctx = canvas.getContext("2d");
      var ch = player.tracks[j];
      let track = song.song.tracks[j];

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      this.renderTrackName(track, ctx);

      if(e.getIn(['states', j, 'mute'])) {
        let pixelSize = 48;
        while(1) {
          ctx.font = `${pixelSize}px monospace`;
          let text = ctx.measureText("MUTE");
          if((text.width < (canvas.width * 0.75)) || 
             (pixelSize < 8)) {
            break;
          }
          pixelSize -= 1;
        }
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#900";
        ctx.fillText("MUTE", canvas.width/2, canvas.height/2);
      } else {
        ctx.fillStyle = '#0f0';
        ctx.strokeStyle = '#04AEF7';
        ctx.lineWidth = 1;

        // volume in dB as a green bar
        //var vu_y = -Math.log(e.vu[j])*10;
        //ctx.fillRect(10, vu_y, 5, canvas.height-vu_y);
        
        const scopeData = e.getIn(['scopes', j, 'scopeData']);
        const bufferLength = e.getIn(['scopes', j, 'bufferLength']);

        ctx.beginPath();

        const sliceWidth = canvas.width * (1.0 / (bufferLength - 1));
        let x = 0;

        for (var i = 0; i < bufferLength; i++) {

          const v = scopeData[i] / 128.0;
          const y = v * canvas.height / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke(); 
      }
    }
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }

  onSongChanged() {
    this.refresh();
  }
}
