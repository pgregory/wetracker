import Signal from '../utils/signal';

import { song } from './songmanager';
import { state } from '../state';

export class HexInput {
  constructor() {
    this.hexNumMin = "0".charCodeAt(0);
    this.hexNumMax = "9".charCodeAt(0);
    this.hexAlphaMin = "a".charCodeAt(0);
    this.hexAlphaMax = "f".charCodeAt(0);
  }

  handleKeyAtCursor(event) {
    // Can't input hex on a note.
    if (state.cursor.get("item") === 0) {
      return false;
    }
    // Only support keys with no modifiers for now.
    if (event.ctrlKey || event.shiftKey || event.metaKey ) {
      return false;
    }


    let val = undefined;
    const charcode = event.key.charCodeAt(0);
    if (charcode >= this.hexNumMin && charcode <= this.hexNumMax) {
      val = charcode - this.hexNumMin;
    } else if(charcode >= this.hexAlphaMin && charcode <= this.hexAlphaMax) {
      val = (charcode - this.hexAlphaMin) + 10;
    } 
    if(val != null) {
      song.setHexValueAtCursor(state.cursor.toJS(), val); 
      return true;
    }
    return false;
  }
}

export let hexInput = new HexInput(); 
  
