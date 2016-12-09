import Signal from '../utils/signal';

import { song } from './songmanager';
import { state } from '../state';

export class FXInput {
  constructor() {
    this.numMin = "0".charCodeAt(0);
    this.numMax = "9".charCodeAt(0);
    this.alphaMin = "a".charCodeAt(0);
    this.alphaMax = "y".charCodeAt(0);

    this.validEffects = [
      "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A",
      "B", "C", "D", "E", "F", "G", "H", "K", "L", "P", "R", 
      "T", "W", "X",
    ];
  }

  handleKeyAtCursor(event) {
    // Can only input fx on the fx column.
    if (state.cursor.get("item") !== 5) {
      return false;
    }
    // Only support keys with no modifiers for now.
    if (event.ctrlKey || event.shiftKey || event.metaKey ) {
      return false;
    }
    // Check if it's a valid effect command
    if (this.validEffects.indexOf(event.key.toUpperCase()) === -1) {
      return false;
    }

    let val = undefined;
    const charcode = event.key.charCodeAt(0);
    if (charcode >= this.numMin && charcode <= this.numMax) {
      val = charcode - this.numMin;
    } else if(charcode >= this.alphaMin && charcode <= this.alphaMax) {
      val = (charcode - this.alphaMin) + 10;
    } 
    if(val != null) {
      song.setFXAtCursor(state.cursor.toJS(), val); 
      return true;
    }
    return false;
  }
}

export let fxInput = new FXInput(); 
  
