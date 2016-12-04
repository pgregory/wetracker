import 'babel-polyfill';
import $ from 'jquery';
import 'gridstack';
import 'gridstack/dist/gridstack.css';
import 'font-awesome-webpack';

import PatternEditorCanvas from './components/pattern_editor/pattern_editor_canvas';
import Monitors from './components/monitors/monitors';
import SequenceEditor from './components/sequence_editor/sequence_editor';
import InstrumentList from './components/instrument_list/instrument_list';

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
    case "t": {
      function download(text, name, type) {
        var a = document.createElement("a");
        var file = new Blob([text], {type: type});
        a.href = URL.createObjectURL(file);
        a.download = name;
        a.click();
      }
      download(JSON.stringify(song.song.instruments[18]), 'cymbal.json', 'text/plain'); 
      break;
    }
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

var options = {
    cellHeight: 40,
    verticalMargin: 5,
    resizable: {
      handles: 'n, ne, e, se, s, sw, w, nw'
    },
    alwaysShowResizeHandle: true,
};
$('.grid-stack').gridstack(options).on('resizestop', function(event, ui) {
  //$('#pattern-editor').empty();
  //PE.render($('#pattern-editor'));
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
    const monitors = new Monitors($('#monitors'));
    const SE = new SequenceEditor($('#sequence-editor'));
    const IL = new InstrumentList($('#instrument-list'));
    window.requestAnimationFrame(() => {
      monitors.render();
      SE.render();
      IL.render();
      var h = $("#pattern-editor").height();
      h = Math.floor(h/12.0);
      if(h%2 === 0) h -= 1;
      h *= 12.0;
      canvas.height = h;
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
