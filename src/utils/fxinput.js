import { song } from './songmanager';
import { state } from '../state';
import { cursor } from './cursor';

export class FXInput {
  constructor() {
    this.numMin = '0'.charCodeAt(0);
    this.numMax = '9'.charCodeAt(0);
    this.alphaMin = 'a'.charCodeAt(0);
    this.alphaMax = 'y'.charCodeAt(0);

    this.validEffects = [
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a',
      'b', 'c', 'd', 'e', 'f', 'g', 'h', 'k', 'l', 'p', 'r',
      't', 'w', 'x',
    ];

    this.validVolumeEffects = [
      '0', '1', '2', '3', '4',
      '-', '+', 'd', 'u', 's', 'v', 'p', 'l', 'r', 'm',
    ];

    this.volumeEffectMap = {
      0: 0x1,
      1: 0x2,
      2: 0x3,
      3: 0x4,
      4: 0x5,
      '-': 0x6,
      '+': 0x7,
      d: 0x8,
      u: 0x9,
      s: 0xa,
      v: 0xb,
      p: 0xc,
      l: 0xd,
      r: 0xe,
      m: 0xf,
    };

    window.addEventListener('keypress', this.handleKeyAtCursor.bind(this));
  }

  handleKeyAtCursor(event) {
    if (state.cursor.get('record')) {
      // Only support keys with no modifiers for now.
      if (event.ctrlKey || event.metaKey) {
        return;
      }
      // Can only input fx on the fx column.
      if (state.cursor.get('item') === 5) {
        // Check if it's a valid effect command
        if (this.validEffects.indexOf(event.key) === -1) {
          return;
        }

        let val;
        const charcode = event.key.charCodeAt(0);
        if (charcode >= this.numMin && charcode <= this.numMax) {
          val = charcode - this.numMin;
        } else if (charcode >= this.alphaMin && charcode <= this.alphaMax) {
          val = (charcode - this.alphaMin) + 10;
        }
        if (val != null) {
          state.groupHistoryStart(`Set ${song.eventItemName(state.cursor.get('item'))} in pattern`);
          song.setFXAtCursor(state.cursor.toJS(), val);
          state.groupHistoryEnd();
          cursor.rowDown(state.transport.get('step'));
        }
      } else if (state.cursor.get('item') === 3) {
        // Check if it's a valid volume effect command
        if (this.validVolumeEffects.indexOf(event.key) === -1) {
          return;
        }

        const val = this.volumeEffectMap[event.key];
        if (val != null) {
          state.groupHistoryStart(`Set ${song.eventItemName(state.cursor.get('item'))} in pattern`);
          song.setHexValueAtCursor(state.cursor.toJS(), val);
          state.groupHistoryEnd();
          cursor.rowDown(state.transport.get('step'));
        }
      }
    }
  }
}

export const fxInput = new FXInput();
