import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';
import { player } from '../../audio/player';

import template from './templates/effects_editor.marko';

import * as chorus from './effects/chorus';
import * as delay from './effects/delay';
import * as phaser from './effects/phaser';
import * as overdrive from './effects/overdrive';
import * as compressor from './effects/compressor';
import * as filter from './effects/filter';
import * as tremolo from './effects/tremolo';
import * as wahwah from './effects/wahwah';
import * as bitcrusher from './effects/bitcrusher';

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
      {
        name: phaser.NAME,
        type: phaser.TYPE,
        constructor: phaser.UI,
        poConstructor: phaser.ParameterObject,
      },
      {
        name: overdrive.NAME,
        type: overdrive.TYPE,
        constructor: overdrive.UI,
        poConstructor: overdrive.ParameterObject,
      },
      {
        name: compressor.NAME,
        type: compressor.TYPE,
        constructor: compressor.UI,
        poConstructor: compressor.ParameterObject,
      },
      {
        name: filter.NAME,
        type: filter.TYPE,
        constructor: filter.UI,
        poConstructor: filter.ParameterObject,
      },
      {
        name: tremolo.NAME,
        type: tremolo.TYPE,
        constructor: tremolo.UI,
        poConstructor: tremolo.ParameterObject,
      },
      {
        name: wahwah.NAME,
        type: wahwah.TYPE,
        constructor: wahwah.UI,
        poConstructor: wahwah.ParameterObject,
      },
      {
        name: bitcrusher.NAME,
        type: bitcrusher.TYPE,
        constructor: bitcrusher.UI,
        poConstructor: bitcrusher.ParameterObject,
      },
    ];

    try {
      $(this.target).append(template.renderToString({effects}));
      let trackEffects = song.getTrackEffects(state.cursor.get("track"));
      for (let i = 0; i < trackEffects.length; i += 1) {
        let fxIndex = effects.findIndex((e) => e.type === trackEffects[i].type);
        if (fxIndex !== -1) {
          let fx = new effects[fxIndex].constructor($(this.target).find("#effects-chain"), trackEffects[i], { type: "track", track: state.cursor.get("track"), index: i });
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
