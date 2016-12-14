import 'babel-polyfill';
import $ from 'jquery';
import 'gridstack';
import 'gridstack/dist/gridstack.css';
import 'font-awesome-webpack';
import 'jquery-ui/widgets/dialog';
import 'jquery-ui/../themes/base/base.css';
import 'jquery-ui/../themes/base/core.css';
import 'jquery-ui/../themes/base/theme.css';
import 'jquery-ui/../themes/base/dialog.css';
import 'jquery-ui/../themes/base/resizable.css';

import Transport from './components/transport/transport';
import Tabs from './components/tabs/tabs';

import gridTemplate from './templates/grid.marko';
import instrumentsViewTemplate from './templates/instrumentsview.marko';

import './components/transport/styles.css';

import { player } from './audio/player';
import modfile from '../data/test-song.xm';

import { song } from './utils/songmanager';
import { state } from './state';
import { cursor } from './utils/cursor';
import { virtualKeyboard } from './utils/virtualkeyboard';
import { hexInput } from './utils/hexinput';
import { fxInput } from './utils/fxinput';

import styles from './styles.css';

$(document).keydown((event) => {
  if ($(event.target).is('input, textarea, select')) {
    return;
  }
  switch (event.key) {
    case "ArrowUp": {
      cursor.rowUp();
      event.preventDefault();
      return;
    }
    case "ArrowDown": {
      cursor.rowDown();
      event.preventDefault();
      return;
    }
    case "ArrowRight": {
      cursor.itemRight();
      event.preventDefault();
      return;
    }
    case "ArrowLeft": {
      cursor.itemLeft();
      break;
    }
    case "Backspace":
    case "Delete": {
      if (event.ctrlKey || event.shiftKey || event.metaKey ) {
        break;
      }
      song.deleteItemAtCursor(state.cursor.toJS());
      event.preventDefault();
      return;
    }
    case "{":
    case "}": {
      state.set({
        transport: {
          step: event.key == "{" ? Math.max(0, state.transport.get("step") - 1) :
                                   state.transport.get("step") + 1,
        },
      });
      break;
    }

    case "\"":
    case "|": {
      state.set({
        transport: {
          octave: event.key == "\"" ? Math.max(0, state.transport.get("octave") - 1) :
                                      state.transport.get("octave") + 1,
        },
      });
      break;
    }
/*    case "s": {
      function download(text, name, type) {
        var a = document.createElement("a");
        var file = new Blob([text], {type: type});
        a.href = URL.createObjectURL(file);
        a.download = name;
        a.click();
      }
      download(JSON.stringify(song.song.instruments[state.cursor.get("instrument")]), 
               song.song.instruments[state.cursor.get("instrument")].name ?
                 `${song.song.instruments[state.cursor.get("instrument")].name}.json` : 
                 `instrument_${state.cursor.get("instrument")}.json`, 
               'text/plain'); 
      break;
    }*/
    default: {
      if(virtualKeyboard.handleKeyAtCursor(event)) {
        cursor.rowDown(state.transport.get("step"));
        event.preventDefault();
        return;
      } else {
        if(hexInput.handleKeyAtCursor(event)) {
          cursor.rowDown(state.transport.get("step"));
          event.preventDefault();
          return;
        } else {
          if(fxInput.handleKeyAtCursor(event)) {
            cursor.rowDown(state.transport.get("step"));
            event.preventDefault();
            return;
          }
        }
      }
      break;
    }
  }
});

$('#song-view').append($(gridTemplate.renderToString()));
$('#instruments-view').append($(instrumentsViewTemplate.renderToString()));

let transport = undefined;
let tabs = undefined;

$(document).ready(() => {
  transport = new Transport("#transport");
  tabs = new Tabs("#tabs");

  window.requestAnimationFrame(() => {

    transport.render();
    tabs.render();

    $('#play').click((e) => {
      player.play();
    });
    $('#play-pattern').click((e) => {
      player.playPattern(state.cursor.get("pattern"));
    });
    $('#stop').click((e) => {
      player.pause();
    });
    $('#reset').click((e) => {
      player.reset();
    });
    $('#new').click((e) => {
      song.newSong();
    });
    $('#load').click((e) => {
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
    $('#save').click((e) => {
      song.saveSongToLocal();
    });
  });
});

