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
    Signal.connect(song, "songChanged", this, "onSongChanged");
  }

  render() {
    var columns = Math.ceil(song.song.tracks.length / 2.0);
    $(this.target).append(monitorsTemplate.renderSync({song: song.song, columns}));

    $(this.target).find(".monitor-canvas").click((e) => {
      this.clickTrack($(e.target).data('trackindex'));
    }); 
  }

  clickTrack(index) {
    player.toggleMuteTrack(index);
  }

  onTracksChanged() {
    var e = state.tracks;
    // update VU meters & oscilliscopes
    for (var j = 0; j < song.song.tracks.length; j++) {
      var canvas = document.getElementById(`vu${j}`);
      var ctx = canvas.getContext("2d");
      var ch = player.tracks[j];

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if(e.getIn(['states', j, 'mute'])) {
        ctx.font = "48px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#900";
        ctx.fillText("MUTE", canvas.width/2, canvas.height/2);
      } else {
        ctx.fillStyle = '#0f0';
        ctx.strokeStyle = '#55acff';
        ctx.lineWidth = 2;

        //var x = 0; //this._pattern_border; // + j * this._pattern_cellwidth;
        // render channel number
        //this.drawText(''+j, x, 1, ctx);

        // volume in dB as a green bar
        //var vu_y = -Math.log(e.vu[j])*10;
        //ctx.fillRect(10, vu_y, 5, canvas.height-vu_y);
        
        const scopeData = e.getIn(['scopes', j, 'scopeData']);
        const bufferLength = e.getIn(['scopes', j, 'bufferLength']);

        ctx.beginPath();

        const sliceWidth = canvas.width * 1.0 / bufferLength;
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

        ctx.lineTo(canvas.width, canvas.height / 2);
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
