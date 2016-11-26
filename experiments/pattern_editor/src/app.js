import 'babel-polyfill';
import $ from 'jquery';
import PatternEditor from './pattern_editor';
import Signal from './utils/signal';


const state = {
  cursor: {
    row: 0,
    track: 0,
    column: 0,
    item: 0,
    onChangeCursor: Signal.signal(true),

    changeCursor: function(row, track, column, item) {
      Object.assign(this, {
                    row: row || this.row, 
                    track: track || this.track, 
                    column: column || this.column,
                    item: item || this.item
      });
      this.onChangeCursor();
    },
  },
};

$('body').keydown((event) => {
  state.cursor.changeCursor(undefined, undefined, undefined, state.cursor.item + 1);
});

const PE = new PatternEditor(state);
PE.render($('#container'));
