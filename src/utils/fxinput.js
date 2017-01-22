import Signal from '../utils/signal';
import MouseTrap from 'mousetrap';

import { song } from './songmanager';
import { state } from '../state';
import { cursor } from '../utils/cursor';

export class FXInput {
  constructor() {
    this.numMin = "0".charCodeAt(0);
    this.numMax = "9".charCodeAt(0);
    this.alphaMin = "a".charCodeAt(0);
    this.alphaMax = "y".charCodeAt(0);

    this.validEffects = [
      "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a",
      "b", "c", "d", "e", "f", "g", "h", "k", "l", "p", "r", 
      "t", "w", "x",
    ];

    window.addEventListener("keyup", this.handleKeyAtCursor.bind(this));
  }

  handleKeyAtCursor(event) {
    if (state.cursor.get("record")) {
      // Can only input fx on the fx column.
      if (state.cursor.get("item") !== 5) {
        return;
      }
      // Only support keys with no modifiers for now.
      if (event.ctrlKey || event.shiftKey || event.metaKey ) {
        return;
      }
      // Check if it's a valid effect command
      if (this.validEffects.indexOf(event.key) === -1) {
        return;
      }

      let val = undefined;
      const charcode = event.key.charCodeAt(0);
      if (charcode >= this.numMin && charcode <= this.numMax) {
        val = charcode - this.numMin;
      } else if(charcode >= this.alphaMin && charcode <= this.alphaMax) {
        val = (charcode - this.alphaMin) + 10;
      } 
      if(val != null) {
        state.groupHistoryStart(`Set ${song.eventItemName(state.cursor.get("item"))} in pattern`);
        song.setFXAtCursor(state.cursor.toJS(), val); 
        state.groupHistoryEnd();
        cursor.rowDown(state.transport.get("step"));
      }
    }
  }
}

export let fxInput = new FXInput(); 
  
