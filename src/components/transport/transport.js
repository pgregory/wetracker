import $ from 'jquery';
import MouseTrap from 'mousetrap';
import 'jquery-ui/widgets/slider';
import 'jquery-ui/widgets/progressbar';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';
import { player } from '../../audio/player';

import transportTemplate from './templates/transport.marko';
import recordTemplate from './templates/record.marko';

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
    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
  }

  render() {
    $(this.target).append(transportTemplate.renderToString({transport: state.transport.toJS(), songname: song.getSongName()}));

    $(this.target).find("#master-volume").slider({
      max: 3.0,
      min: -36.0,
      range: "min",
      step: 0.1,
      value: state.transport.get("masterVolume"),
      slide: (e, ui) => {
        state.set({
          transport: {
            masterVolume: ui.value,
          }
        });
      },
    });
 
    $(this.target).find('input').bind("enterKey", (e) => {
      state.set({
        transport: {
          octave: parseInt($(this.target).find("#octave").val()),
        },
      });
      song.setBPM(parseInt($(this.target).find("#bpm").val()));
      song.setSpeed(parseInt($(this.target).find("#speed").val()));
      $(e.target).blur();
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
      player.playPattern(state.cursor.get("sequence"));
    });
    $(this.target).find('#pause').click((e) => {
      player.pause();
    });
    $(this.target).find('#stop').click((e) => {
      player.stop();
    });
    $(this.target).find('#reset').click((e) => {
      player.stop();
      player.reset();
    });
    $(this.target).find('#new').click((e) => {
      player.stop();
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
            player.stop();
            song.downloadSong(modfile);
            $( this ).dialog( "close" );
          }
        }
      });
    });
    $(this.target).find('#save').click((e) => {
      song.saveSongToLocal();
    });
    $(this.target).find('#record').click((e) => {
      player.stop();
      player.reset();
      state.set({
        cursor: {
          saveStream: true,
        },
      });

      try {
        $( "#dialog" ).empty();
        $( "#dialog" ).append(recordTemplate.renderToString());

        let max = song.getSequenceLength();
        $("#record-progress").prop("max", max);
        const dialog = $( "#dialog" ).dialog({
          width: 500,
          modal: true,
          title: "Record Song",
          close: function(event, ui) {
            player.stopRecordingStream();
            player.stop();
          },
        });

        player.record().then(() => {
          dialog.dialog("close");
        });
      } catch(e) {
        console.log(e);
      }

    });
  }

  onTransportChanged() {
    if (this.lastTransport !== state.transport) {
      $(this.target).find("#octave").val(state.transport.get("octave"));
      $(this.target).find("#bpm").val(state.transport.get("bpm"));
      $(this.target).find("#speed").val(state.transport.get("speed"));

      $(this.target).find("#master-volume").slider('value', state.transport.get("masterVolume"));

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

  onCursorChanged() {
    if(state.cursor.get("saveStream")) {
      let sequence = state.cursor.get("recordSequence");
      $("#record-progress").val(sequence);
      $("#record-seq").text("" + sequence + "/" + song.getSequenceLength());
    }
  }
}
