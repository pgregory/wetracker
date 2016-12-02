import $ from 'jquery';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import monitorsTemplate from './templates/monitors.marko';

import styles from './styles.css';

export default class Monitors {
  constructor() {
    this._scope_width = 50,

    Signal.connect(state, "tracksChanged", this, "onTracksChanged");
  }

  render(target) {
    var columns = Math.ceil(song.song.tracks.length / 2.0);
    $(target).append(monitorsTemplate.renderSync({song: song.song, columns}));
  }

  onTracksChanged() {
    var e = state.tracks.toJS();
    if (e.scopes !== undefined) {
      // update VU meters & oscilliscopes
      for (var j = 0; j < song.song.tracks.length; j++) {
        var canvas = document.getElementById(`vu${j}`);
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0f0';
        ctx.strokeStyle = '#55acff';

        var x = 0; //this._pattern_border; // + j * this._pattern_cellwidth;
        // render channel number
        //this.drawText(''+j, x, 1, ctx);

        // volume in dB as a green bar
        var vu_y = -Math.log(e.vu[j])*10;
        ctx.fillRect(10, vu_y, 5, canvas.height-vu_y);

        var scale = canvas.width/this._scope_width;

        // oscilloscope
        var scope = e.scopes[j];
        if (scope) {
          ctx.beginPath();
          for (var k = 0; k < this._scope_width; k++) {
            ctx.lineTo((x + 1 + k)*scale, (canvas.height/2) - 16 * scope[k]);
          }
          ctx.stroke();
        }
      }
    }
  }
}
