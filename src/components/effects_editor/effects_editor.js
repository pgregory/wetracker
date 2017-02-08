import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';
import { player } from '../../audio/player';

import template from './templates/effects_editor.marko';

import ChorusEffect from './effects/chorus.js';

import styles from './styles.css';

export default class EffectsEditor {
  constructor(target) {
    this.target = target;
    this.lastCursor = state.cursor;
    this.track = undefined;

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
  }

  render() {
    const cur_track = state.cursor.get("track");
    const effects = [
      {
        name: "Overdrive",
      },
      {
        name: "Filter",
      },
      {
        name: "Cabinet",
      },
      {
        name: "Delay",
      },
      {
        name: "Reverb",
      },
      {
        name: "Compressor",
      },
      {
        name: "WahWah",
      },
      {
        name: "Tremolo",
      },
      {
        name: "Phaser",
      },
      {
        name: "Chorus",
      },
      {
        name: "Bitcrusher",
      },
      {
        name: "Moog Filter",
      },
      {
        name: "Ping Pong Delay",
      },
      {
        name: "Panner",
      },
      {
        name: "Gain",
      }
    ];

    try {
      $(this.target).append(template.renderToString({effects}));
      let trackEffects = song.getTrackEffects(0);
      for (let i = 0; i < trackEffects.length; i += 1) {
        let chorus = new ChorusEffect($(this.target).find("#effects-chain"), trackEffects[i]);
        chorus.render();
      }
    } catch(e) {
      console.log(e);
    }
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }

  onCursorChanged() {
    if (state.cursor.get("track") !== this.lastCursor.get("track")) {
      this.target.empty();
      this.render();
      this.lastCursor = state.cursor;
    }
  }

  onSongChanged() {
    this.refresh();
  }
}
