import 'babel-polyfill';
import doT from 'dot';
import $ from 'jquery';
import 'gridstack';
import 'gridstack/dist/gridstack.css';

import PatternEditor from './pattern_editor';

import { state } from './state';
import song from '../data/song.json';


import gridTemplate from './templates/grid.dot';

$('body').keydown((event) => {
  switch (event.key) {
    case "ArrowUp": {
      let row = state.cursor.get("row") - 1;
      if (row < 0) {
        row = song.patterns[0].rows - 1;
      }
      state.set({
        cursor: {
          row,
        }
      });
      break;
    }
    case "ArrowDown": {
      let row = state.cursor.get("row") + 1;
      if (row >= song.patterns[0].rows) {
        row = 0;
      }
      state.set({
        cursor: {
          row,
        }
      });
      break;
    }
    case "ArrowRight": {
      let item = state.cursor.get("item");
      let track = state.cursor.get("track");
      let column = state.cursor.get("column");
      item += 1;
      if (item > 5 ) {
        item = 0; 
        column += 1;
        if (column >= song.tracks[track].notecolumns) {
          column = 0;
          track += 1;
          if (track >= song.tracks.length) {
            track = 0;
          }
        }
      }
      state.set({
        cursor: {
          track,
          column,
          item, 
        }
      });
      break;
    }
    case "ArrowLeft": {
      let item = state.cursor.get("item");
      let track = state.cursor.get("track");
      let column = state.cursor.get("column");
      item -= 1;
      if (item < 0 ) {
        item = 5; 
        column -= 1;
        if (column < 0) {
          track -= 1;
          if (track < 0) {
            track = song.tracks.length - 1;
          }
          column = song.tracks[track].notecolumns - 1;
        }
      }
      state.set({
        cursor: {
          track,
          column,
          item, 
        }
      });
      break;
    }
    default:
      return;
  }
  event.preventDefault();
});

var grid = doT.template(gridTemplate);
$(grid()).appendTo($('#container'));

const PE = new PatternEditor();
PE.render($('#pattern-editor'));

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
});
