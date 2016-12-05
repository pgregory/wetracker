import 'babel-polyfill';
import $ from 'jquery';
import 'gridstack';
import 'gridstack/dist/gridstack.css';
import 'font-awesome-webpack';

import PatternEditorCanvas from './components/pattern_editor/pattern_editor_canvas';
import Monitors from './components/monitors/monitors';
import SequenceEditor from './components/sequence_editor/sequence_editor';
import InstrumentList from './components/instrument_list/instrument_list';
import SampleEditor from './components/sample_editor/sample_editor';

import gridTemplate from './templates/grid.marko';
import transportTemplate from './components/transport/templates/transport.marko';

import './components/transport/styles.css';

import XMPlayer from './audio/xm';
import XMView from './audio/trackview';
import modfile from '../data/onward.xm';

import { song } from './utils/songmanager';
import { state } from './state';
import { cursor } from './utils/cursor';
import { virtualKeyboard } from './utils/virtualkeyboard';

import styles from './styles.css';

$(document).keydown((event) => {
  switch (event.key) {
    case "ArrowUp": {
      cursor.rowUp();
      break;
    }
    case "ArrowDown": {
      cursor.rowDown();
      break;
    }
    case "ArrowRight": {
      cursor.itemRight();
      break;
    }
    case "ArrowLeft": {
      cursor.itemLeft();
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
        cursor.rowDown(4);
        break;
      }
      return;
    }
  }
  event.preventDefault();
});

$(transportTemplate.renderSync()).appendTo($('#transport'));

$('#container').append($(gridTemplate.renderSync()));

//const PE = new PatternEditorCanvas($('#gfxpattern'));
let PE = undefined;
let sequenceEditor = undefined;
let monitors = undefined;
let instrumentList = undefined;
let sampleEditor = undefined;

var options = {
    cellHeight: 40,
    verticalMargin: 5,
    resizable: {
      handles: 'n, ne, e, se, s, sw, w, nw'
    },
    alwaysShowResizeHandle: true,
};
$('.grid-stack').gridstack(options).on('resizestop', function(event, ui) {
  PE.refresh();
  sequenceEditor.refresh();
  instrumentList.refresh();
  sampleEditor.refresh();
  monitors.refresh();
}).on('change', function(event, items) {
  console.log("Changed");
});


function downloadXM(uri, player) {
  var xmReq = new XMLHttpRequest();
  xmReq.open("GET", uri, true);
  xmReq.responseType = "arraybuffer";
  xmReq.onload = function (xmEvent) {
    var arrayBuffer = xmReq.response;
    if (arrayBuffer) {
      if(player.load(arrayBuffer)) {
        //player.play();
      }
    } else {
      console.log("unable to load", uri);
    }
    var canvas = document.getElementById('gfxpattern');
    PE = new PatternEditorCanvas(canvas);
    monitors = new Monitors($('#monitors'));
    sequenceEditor = new SequenceEditor($('#sequence-editor'));
    instrumentList = new InstrumentList($('#instrument-list'));
    sampleEditor = new SampleEditor($('#sample-editor'));
    window.requestAnimationFrame(() => {
      PE.render();
      monitors.render();
      sequenceEditor.render();
      instrumentList.render();
      sampleEditor.render();
    });

  };
  xmReq.send(null);
}

$(document).ready(() => {
  var player = new XMPlayer();
  downloadXM(modfile, player);

  $('#play').click((e) => {
    player.play();
  });
  $('#stop').click((e) => {
    player.stop();
  });
  $('#pause').click((e) => {
    player.pause();
  });
  $('#new').click((e) => {
    song.newSong();
  });
});
