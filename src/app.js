import 'babel-polyfill';
import doT from 'dot';
import $ from 'jquery';
import 'gridstack';
import 'gridstack/dist/gridstack.css';
import 'font-awesome-webpack';

import PatternEditor from './pattern_editor';
import Monitors from './components/monitors/monitors';
import gridTemplate from './templates/grid.marko';
import transportTemplate from './components/transport/templates/transport.dot';
import './components/transport/styles.css';

import XMPlayer from './audio/xm';
import XMView from './audio/trackview';
import modfile from '../data/onward.xm';

import { song } from './utils/songmanager';
import { state } from './state';
import { cursor } from './utils/cursor';

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
    case "a": {
      song.addNoteToSong(state.cursor.toJS());
      cursor.rowDown(4);
      break;
    }
    default:
      return;
  }
  event.preventDefault();
});

var transport = doT.template(transportTemplate);
$(transport()).appendTo($('#transport'));

$('#container').append($(gridTemplate.renderSync()));

const PE = new PatternEditor();
/*window.requestAnimationFrame(() => {
  PE.render($('#pattern-editor'));
});*/

var options = {
    cellHeight: 40,
    verticalMargin: 5,
    resizable: {
      handles: 'n, ne, e, se, s, sw, w, nw'
    },
    alwaysShowResizeHandle: true,
};
$('.grid-stack').gridstack(options).on('resizestop', function(event, ui) {
  $('#pattern-editor').empty();
  PE.render($('#pattern-editor'));
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
    const monitors = new Monitors();
    window.requestAnimationFrame(() => {
      monitors.render($('#monitors'));
      document.getElementById('gfxpattern').height = $("#pattern-editor").height();
      var trackview = new XMView(player);
      player.setView(trackview);
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
});
