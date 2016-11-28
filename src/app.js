import 'babel-polyfill';
import doT from 'dot';
import $ from 'jquery';
import 'gridstack';
import 'gridstack/dist/gridstack.css';
import 'font-awesome-webpack';

import PatternEditor from './pattern_editor';
import gridTemplate from './templates/grid.dot';
import transportTemplate from './components/transport/templates/transport.dot';
import './components/transport/styles.css';

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

var grid = doT.template(gridTemplate);
$(grid()).appendTo($('#container'));

const PE = new PatternEditor();
window.requestAnimationFrame(() => {
  PE.render($('#pattern-editor'));
});

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
