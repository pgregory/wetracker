import $ from 'jquery';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import transportTemplate from './templates/transport.marko';

import styles from './styles.css';

export default class Transport {
  constructor(target) {
    this.target = target;
    this.lastTransport = undefined;

    Signal.connect(state, "transportChanged", this, "onTransportChanged");
  }

  render() {
    $(this.target).append(transportTemplate.renderSync({transport: state.transport.toJS()}));
 
    $('input').bind("enterKey",function(e){
      console.log($("#step").val());
      state.set({
        transport: {
          step: parseInt($("#step").val()),
          octave: parseInt($("#octave").val()),
        },
      });
      $(this).blur();
    });
    $('input').keyup(function(e){
      if(e.keyCode == 13)
      {
        $(this).trigger("enterKey");
      }
    });
  }

  onTransportChanged() {
    if (this.lastTransport !== state.transport) {
      console.log(state.transport.get("step"));
      $(this.target).find("#step").val(state.transport.get("step"));
      $(this.target).find("#octave").val(state.transport.get("octave"));

      this.lastTransport = state.transport;
    }
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }

  onSongChanged() {
    this.refresh();
  }
}
