import $ from 'jquery';
import 'jquery-ui/widgets/slider';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';
import { player } from '../../audio/player';

import template from './templates/effects_editor.marko';

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
      this.track = song.song.tracks[cur_track];

      //if (this.track && 'effects' in this.track && this.track.effects.length > 0) {
        $(this.target).append(template.renderToString({track: this.track, effects}));
        let rateSlider = $("#rate-slider").slider({
          min: 0.01,
          max: 8,
          step: 0.01,
          value: 1.5,
          slide: (event, ui) => {
            $("#rate-value").val(ui.value);
          }
        });
        $("#rate-value").on("change", (e) => {
          rateSlider.slider("value", $(e.target).val());
        });
        let feedbackSlider = $("#feedback-slider").slider({
          min: 0,
          max: 1,
          step: 0.001,
          value: 0.2,
          slide: (event, ui) => {
            $("#feedback-value").val(ui.value);
          }
        });
        $("#feedback-value").on("change", (e) => {
          feedbackSlider.slider("value", $(e.target).val());
        });
        let delaySlider = $("#delay-slider").slider({
          min: 0,
          max: 1,
          step: 0.001,
          value: 0.0045,
          slide: (event, ui) => {
            $("#delay-value").val(ui.value);
          }
        });
        $("#delay-value").on("change", (e) => {
          delaySlider.slider("value", $(e.target).val());
        });
        $("#bypass").on("change", (e) => {
          player.chorus.bypass = !e.target.checked;
        });
      //}
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
