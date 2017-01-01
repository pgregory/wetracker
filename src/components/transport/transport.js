import $ from 'jquery';
import MouseTrap from 'mousetrap';
import 'jquery-ui/widgets/slider';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';
import { player } from '../../audio/player';

import transportTemplate from './templates/transport.marko';

import modfile from '../../../data/onward.xm';

import styles from './styles.css';

export default class Transport {
  constructor(target) {
    this.target = target;
    this.lastTransport = undefined;

    MouseTrap.bind(["{", "}"], (e) => {
      state.set({
        transport: {
          step: e.key == "{" ? Math.max(0, state.transport.get("step") - 1) :
                               state.transport.get("step") + 1,
        },
      });
      e.preventDefault();
    });

    MouseTrap.bind(["\"", "|"], (e) => {
      state.set({
        transport: {
          octave: e.key == "\"" ? Math.max(0, state.transport.get("octave") - 1) :
                                  state.transport.get("octave") + 1,
        },
      });
      e.preventDefault();
    });

    Signal.connect(state, "transportChanged", this, "onTransportChanged");
    Signal.connect(song, "songChanged", this, "onSongChanged");
  }

  render() {
    $(this.target).append(transportTemplate.renderToString({transport: state.transport.toJS(), song: song.song}));

    $(this.target).find("#master-volume").slider({
      max: 1.0,
      min: 0.0,
      range: "min",
      step: 0.01,
      value: player.gainNode.gain.value,
      slide: (e, ui) => {
        player.gainNode.gain.value = ui.value;
      },
    });
 
    $(this.target).find('input').bind("enterKey",function(e){
      state.set({
        transport: {
          step: parseInt($(this.target).find("#step").val()),
          octave: parseInt($(this.target).find("#octave").val()),
        },
      });
      $(this).blur();
    });
    $(this.target).find('input').keyup(function(e){
      if(e.keyCode == 13)
      {
        $(this).trigger("enterKey");
      }
    });
    $(this.target).find('#play').click((e) => {
      player.play();
    });
    $(this.target).find('#play-pattern').click((e) => {
      player.playPattern(state.cursor.get("pattern"));
    });
    $(this.target).find('#pause').click((e) => {
      player.pause();
    });
    $(this.target).find('#stop').click((e) => {
      player.stop();
    });
    $(this.target).find('#reset').click((e) => {
      player.reset();
    });
    $(this.target).find('#new').click((e) => {
      song.newSong();
    });
    $(this.target).find('#load').click((e) => {
      $( "#dialog" ).empty();
      $( "#dialog" ).append($("<input type=\"file\" id=\"file-input\" />"));
      $( "#dialog" ).dialog({
        width: 500,
        modal: true,
        buttons: {
          Ok: function() {
            var files = $("#file-input")[0].files;
            if (files.length > 0) {
              song.loadSongFromFile(files[0], (result) => {
                song.setSong(result);
              });
            }
            $( this ).dialog( "close" );
          },
          Cancel: function() {
            $( this ).dialog( "close" );
          },
          Demo: function() {
            song.downloadSong(modfile);
            $( this ).dialog( "close" );
          }
        }
      });
    });
    $(this.target).find('#save').click((e) => {
      song.saveSongToLocal();
    });
  }

  onTransportChanged() {
    if (this.lastTransport !== state.transport) {
      $(this.target).find("#step").val(state.transport.get("step"));
      $(this.target).find("#octave").val(state.transport.get("octave"));

      this.lastTransport = state.transport;
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
