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
import loadTemplate from './templates/load.marko';

import './styles.css';

export default class Transport {
  constructor(target) {
    this.target = target;
    this.lastTransport = undefined;

    MouseTrap.bind(['{', '}'], (e) => {
      state.set({
        transport: {
          step: e.key === '{' ? Math.max(0, state.transport.get('step') - 1)
            : state.transport.get('step') + 1,
        },
      });
      e.preventDefault();
    });

    MouseTrap.bind(['\'', '|'], (e) => {
      state.set({
        transport: {
          octave: e.key === '\'' ? Math.max(0, state.transport.get('octave') - 1)
            : state.transport.get('octave') + 1,
        },
      });
      e.preventDefault();
    });

    MouseTrap.bind('ctrl+l', () => {
      song.dumpSongToConsole();
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
      $('#dialog').append(loadTemplate.renderToString());
      const actualBtn = $('#dialog #file-input');
      const fileChosen = $('#dialog #file-chosen');
      actualBtn.on('change', (e) => {
        fileChosen.text(e.target.files[0].name);
      });
      $('#dialog').dialog({
        width: 500,
        modal: true,
        buttons: {
          Ok: function ok() {
            const { files } = $('#file-input')[0];
            const url = $('#url-input').val();
            if (files.length > 0) {
              song.loadSongFromFile(files[0], (result) => {
                song.setSong(result);
              });
            } else if (url !== '') {
              song.downloadSong(url).then(() => {
                $(this).dialog('close');
              }, (msg) => {
                $(this).dialog('close');
                $('#dialog').empty();
                $('#dialog').append($(`<p>${msg}</p>`));
                const errorDialog = $('#dialog').dialog({
                  width: 500,
                  modal: true,
                  buttons: {
                    OK: () => {
                      errorDialog.dialog('close');
                    },
                  },
                });
              });
            }
            $(this).dialog('close');
          },
          Cancel: function cancel() {
            $(this).dialog('close');
          },
        },
      });
    });
    $(this.target).find('#save').click(() => {
      song.saveSongToLocal();
    });
    $(this.target).find('#export').click(() => {
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

    $(this.target).find('#record').on('click', () => {
      if (player.playing) {
        player.pause();
      } else {
        state.set({
          cursor: {
            record: !state.cursor.get('record'),
          },
        });
      }
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
    $(this.target).find('#songname').val(song.getSongName());
  }

  onCursorChanged() {
    $(this.target).find('#record').toggleClass('record', state.cursor.get('record'));
    if (state.cursor.get('saveStream')) {
      const sequence = state.cursor.get('recordSequence');
      $('#record-progress').val(sequence);
      $('#record-seq').text(`${sequence}/${song.getSequenceLength()}`);
    }
  }
}
