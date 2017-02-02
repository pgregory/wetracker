import $ from 'jquery';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';
import { player, SILENT, MUTE } from '../../audio/player';

import monitorsTemplate from './templates/monitors.marko';

import styles from './styles.css';

export default class Monitors {
  constructor(target) {
    this._scope_width = 50,
    this.target = target;
    this.tracks = {
      t: 0,
      VU: [],
      scopes: []
    };

    Signal.connect(player, "tracksChanged", this, "onTracksChanged");
    Signal.connect(song, "trackChanged", this, "onTrackChanged");
    Signal.connect(song, "songChanged", this, "onSongChanged");
  }

  render() {
    $(this.target).addClass('monitors');
    const numtracks = song.getNumTracks();
    const columns = Math.ceil(numtracks / 2.0);
    $(this.target).append(monitorsTemplate.renderToString({numtracks, columns}));

    for (var j = 0; j < numtracks; j++) {
      var canvas = document.getElementById(`vu${j}`);
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    this.renderMonitors();

    $(this.target).find(".monitor-canvas").click((e) => {
      this.clickTrack(e, $(e.target).data('trackindex'));
    }); 
  }

  clickTrack(e, index) {
    if(e.shiftKey) {
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
    this.tracks = tracks;
    this.renderMonitors();
  }

  onTrackChanged() {
    this.renderMonitors();
  }

  renderTrackName(trackname, ctx) {
    ctx.font = "10px monospace";
    ctx.fillStyle = '#888';
    ctx.textAlign = 'start';
    ctx.textBaseline = 'top';
    ctx.fillText(trackname, 2, 2);
  }

  renderMonitors() {
    var e = this.tracks;
    const numtracks = song.getNumTracks();
    const trackNames = song.getTrackNames();
    // update VU meters & oscilliscopes
    for (let j = 0; j < numtracks; j += 1) {
      var canvas = document.getElementById(`vu${j}`);
      var ctx = canvas.getContext("2d");
      var ch = player.tracks[j];

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      this.renderTrackName(trackNames[j], ctx);

      if('states' in e && [MUTE, SILENT].indexOf(e.states[j].state) !== -1) {
        let text = "MUTE";
        let color = "#900";
        if (e.states[j].state === SILENT) {
          text = "SILENT";
          color = "#099";
        }
        let pixelSize = 48;
        while(1) {
          ctx.font = `${pixelSize}px monospace`;
          let size = ctx.measureText(text);
          if((size.width < (canvas.width * 0.75)) || 
             (pixelSize < 8)) {
            break;
          }
          pixelSize -= 1;
        }
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = color;
        ctx.fillText(text, canvas.width/2, canvas.height/2);
      } else {
        ctx.fillStyle = '#0f0';
        ctx.strokeStyle = '#04AEF7';
        ctx.lineWidth = 1;

        // volume in dB as a green bar
        //var vu_y = -Math.log(e.vu[j])*10;
        //ctx.fillRect(10, vu_y, 5, canvas.height-vu_y);
        
        if ('scopes' in e && j < e.scopes.length && 'scopeData' in e.scopes[j]) {
          const scopeData = e.scopes[j].scopeData;
          const bufferLength = e.scopes[j].bufferLength;

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
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }

  onSongChanged() {
    this.refresh();
  }
}
