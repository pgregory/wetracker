import Signal from '../utils/signal';

import { song } from './songmanager';
import { state } from '../state';
import { cursor } from '../utils/cursor';

export class HexInput {
  constructor() {
    this.hexNumMin = "0".charCodeAt(0);
    this.hexNumMax = "9".charCodeAt(0);
    this.hexAlphaMin = "a".charCodeAt(0);
    this.hexAlphaMax = "f".charCodeAt(0);

    this.validKeys = [
      "0", "1", "2", "3", "4", "5", "6", "7",
      "8", "9", "a", "b", "c", "d", "e", "f",
    ];

    window.addEventListener("keypress", this.handleKeyAtCursor.bind(this));
  }

  handleKeyAtCursor(event) {
    if (state.cursor.get("record")) {
      // Can't input hex on a note.
      if (state.cursor.get("item") === 0 || state.cursor.get("item") === 5 || state.cursor.get("item") === 3) {
        return;
      }
      // Only support keys with no modifiers for now.
      if (event.ctrlKey || event.shiftKey || event.metaKey ) {
        return;
      }

      let val = undefined;
      const charcode = event.key.charCodeAt(0);
      if (charcode >= this.hexNumMin && charcode <= this.hexNumMax) {
        val = charcode - this.hexNumMin;
      } else if(charcode >= this.hexAlphaMin && charcode <= this.hexAlphaMax) {
        val = (charcode - this.hexAlphaMin) + 10;
      } 
      if(val != null) {
        state.groupHistoryStart(`Set ${song.eventItemName(state.cursor.get("item"))} in pattern`);
        song.setHexValueAtCursor(state.cursor.toJS(), val); 
        state.groupHistoryEnd();
        cursor.rowDown(state.transport.get("step"));
      }
      return;
    }
  }
}

export let hexInput = new HexInput(); 
  
