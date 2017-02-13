import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';
import { player } from '../../audio/player';

import template from './templates/effects_editor.marko';

import * as chorus from './effects/chorus.js';
import * as delay from './effects/delay.js';

import styles from './styles.css';

export default class EffectsEditor {
  constructor(target) {
    this.target = target;
    this.lastCursor = state.cursor;
    this.track = undefined;

    Signal.connect(state, "cursorChanged", this, "onCursorChanged");
    Signal.connect(song, "songChanged", this, "onSongChanged");
    Signal.connect(song, "trackEffectChainChanged", this, "onTrackEffectChainChanged");
  }

  render() {
    const cur_track = state.cursor.get("track");
    const effects = [
      {
        name: chorus.NAME,
        type: chorus.TYPE,
        constructor: chorus.UI,
        poConstructor: chorus.ParameterObject,
      },
      {
        name: delay.NAME,
        type: delay.TYPE,
        constructor: delay.UI,
        poConstructor: delay.ParameterObject,
      },
    ];

    try {
      $(this.target).append(template.renderToString({effects}));
      let trackEffects = song.getTrackEffects(0);
      for (let i = 0; i < trackEffects.length; i += 1) {
        let fxIndex = effects.findIndex((e) => e.type === trackEffects[i].type);
        if (fxIndex !== -1) {
          let fx = new effects[fxIndex].constructor($(this.target).find("#effects-chain"), trackEffects[i], { type: "track", track: 0, index: i });
          Signal.connect(fx, "effectChanged", this, "onEffectInterfaceChanged");
          fx.render();
        }
      }

      $(this.target).find(".effect-name").dblclick((e) => {
        let fxIndex = $(e.target).data("fxindex");
        song.appendEffectToTrackChain(state.cursor.get("track"), new effects[fxIndex].poConstructor());
      });
    } catch(e) {
      console.log(e);
    }
  }

  onEffectInterfaceChanged(location, effect) {
    if (location.type === "track" && "track" in location) {
      try {
        song.updateTrackEffect(location.track, location.index, effect);
      } catch(e) {
        console.log(e);
      }
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

  onTrackEffectChainChanged(trackIndex) {
    // TODO: Check if the changed track is currently displayed.
    this.refresh();
  }
}
