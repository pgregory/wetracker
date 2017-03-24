/* global gapi:false */
import $ from 'jquery';
import MouseTrap from 'mousetrap';
import 'jquery-ui/widgets/slider';
import 'jquery-ui/widgets/progressbar';

import { connect } from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';
import { player } from '../../audio/player';

import transportTemplate from './templates/transport.marko';
import recordTemplate from './templates/record.marko';

import modfile from '../../../data/onward.xm';

import './styles.css';

export default class Transport {
  constructor(target) {
    this.target = target;
    this.lastTransport = undefined;

    MouseTrap.bind(['{', '}'], (e) => {
      state.set({
        transport: {
          step: e.key === '{' ? Math.max(0, state.transport.get('step') - 1) :
                               state.transport.get('step') + 1,
        },
      });
      e.preventDefault();
    });

    MouseTrap.bind(['\'', '|'], (e) => {
      state.set({
        transport: {
          octave: e.key === '\'' ? Math.max(0, state.transport.get('octave') - 1) :
                                  state.transport.get('octave') + 1,
        },
      });
      e.preventDefault();
    });

    connect(state, 'transportChanged', this, 'onTransportChanged');
    connect(song, 'songChanged', this, 'onSongChanged');
    connect(state, 'cursorChanged', this, 'onCursorChanged');
  }

  render() {
    $(this.target).append(transportTemplate.renderToString({ transport: state.transport.toJS(), songname: song.getSongName() }));

    $(this.target).find('#master-volume').slider({
      max: 3.0,
      min: -36.0,
      range: 'min',
      step: 0.1,
      value: state.transport.get('masterVolume'),
      slide: (e, ui) => {
        state.set({
          transport: {
            masterVolume: ui.value,
          },
        });
      },
    });

    $(this.target).find('input').bind('enterKey', (e) => {
      state.set({
        transport: {
          octave: parseInt($(this.target).find('#octave').val(), 10),
        },
      });
      song.setBPM(parseInt($(this.target).find('#bpm').val(), 10));
      song.setSpeed(parseInt($(this.target).find('#speed').val(), 10));
      $(e.target).blur();
    });
    $(this.target).find('input').keyup(function keyup(e) {
      if (e.keyCode === 13) {
        $(this).trigger('enterKey');
      }
    });
    $(this.target).find('#play').click(() => {
      player.play();
    });
    $(this.target).find('#play-pattern').click(() => {
      player.playPattern(state.cursor.get('sequence'));
    });
    $(this.target).find('#pause').click(() => {
      player.pause();
    });
    $(this.target).find('#stop').click(() => {
      player.stop();
    });
    $(this.target).find('#reset').click(() => {
      player.stop();
      player.reset();
    });
    $(this.target).find('#new').click(() => {
      player.stop();
      song.newSong();
    });
    $(this.target).find('#load').click(() => {
      $('#dialog').empty();
      $('#dialog').append($('<input type=\'file\' id=\'file-input\' />'));
      $('#dialog').dialog({
        width: 500,
        modal: true,
        buttons: {
          Ok: function ok() {
            const files = $('#file-input')[0].files;
            if (files.length > 0) {
              song.loadSongFromFile(files[0], (result) => {
                song.setSong(result);
              });
            }
            $(this).dialog('close');
          },
          Cancel: function cancel() {
            $(this).dialog('close');
          },
          Demo: function demo() {
            player.stop();
            song.downloadSong(modfile);
            $(this).dialog('close');
          },
        },
      });
    });
    $(this.target).find('#save').click(() => {
      song.saveSongToLocal();
    });
    $(this.target).find('#record').click(() => {
      player.stop();
      player.reset();
      state.set({
        cursor: {
          saveStream: true,
        },
      });

      try {
        $('#dialog').empty();
        $('#dialog').append(recordTemplate.renderToString());

        const max = song.getSequenceLength();
        $('#record-progress').prop('max', max);
        const dialog = $('#dialog').dialog({
          width: 500,
          modal: true,
          title: 'Record Song',
          close: function close() {
            player.stopRecordingStream();
            player.stop();
          },
        });

        player.record().then(() => {
          dialog.dialog('close');
        });
      } catch (e) {
        console.log(e);
      }
    });

    $(this.target).find('#login').click(() => {
      gapi.auth2.getAuthInstance().signIn();
      song.downloadSongFromGDrive('0B1WNHlU9Fgw1VW1JcmVqNGo5TFE');
    });
    $(this.target).find('#logout').click(() => {
      gapi.auth2.getAuthInstance().signOut();
    });
  }

  onTransportChanged() {
    if (this.lastTransport !== state.transport) {
      $(this.target).find('#octave').val(state.transport.get('octave'));
      $(this.target).find('#bpm').val(state.transport.get('bpm'));
      $(this.target).find('#speed').val(state.transport.get('speed'));

      $(this.target).find('#master-volume').slider('value', state.transport.get('masterVolume'));

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
    if (state.cursor.get('saveStream')) {
      const sequence = state.cursor.get('recordSequence');
      $('#record-progress').val(sequence);
      $('#record-seq').text(`${sequence}/${song.getSequenceLength()}`);
    }
  }
}
