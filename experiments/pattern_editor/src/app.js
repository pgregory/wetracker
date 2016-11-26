import 'babel-polyfill';
import $ from 'jquery';
import PatternEditor from './pattern_editor';

import { state } from './state';


$('body').keydown((event) => {
  state.set({
    cursor: {
      item: state.cursor.item + 1,
    }
  });
});

const PE = new PatternEditor();
PE.render($('#container'));
