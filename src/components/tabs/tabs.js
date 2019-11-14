import $ from 'jquery';

// import PatternEditorCanvas from '../pattern_editor/pattern_editor_canvas';
import PatternEditorDOM from '../pattern_editor/pattern_editor_dom';
import Monitors from '../monitors/monitors';
import SequenceEditor from '../sequence_editor/sequence_editor';
import InstrumentList from '../instrument_list/instrument_list';
import SampleList from '../sample_list/sample_list';
import SampleEditor from '../sample_editor/sample_editor';
import VolumeEnvelope from '../instrument_editor/volume_envelope';
import PanningEnvelope from '../instrument_editor/panning_envelope';
import InstrumentControls from '../instrument_editor/instrument_controls';
import SampleMapper from '../sample_mapper/sample_mapper';
import EffectsEditor from '../effects_editor/effects_editor';
import Browser from '../browser/browser';

import tabsTemplate from './templates/tabs.marko';

export default class Tabs {
  constructor(target) {
    this.target = target;
    this.widgets = [];

    this.options = {
      cellHeight: 40,
      verticalMargin: 5,
      resizable: {
        handles: 'ne, se, sw, nw',
      },
      width: 50,
      handleClass: 'widget-titlebar',
      alwaysShowResizeHandle: true,
    };

    this.widgetTypes = {
      'pattern-editor': (t) => new PatternEditorDOM(t),
      monitors: (t) => new Monitors(t),
      'sequence-editor': (t) => new SequenceEditor(t),
      'instrument-list': (t) => new InstrumentList(t),
      'sample-list': (t) => new SampleList(t),
      'sample-editor': (t) => new SampleEditor(t),
      'volume-envelope': (t) => new VolumeEnvelope(t),
      'panning-envelope': (t) => new PanningEnvelope(t),
      'instrument-controls': (t) => new InstrumentControls(t),
      'sample-mapper': (t) => new SampleMapper(t),
      'effects-editor': (t) => new EffectsEditor(t),
      browser: (t) => new Browser(t),
    };
  }

  render() {
    $(this.target).append(tabsTemplate.renderToString());

    $(this.target).find('.tablinks').click((e) => {
      // Get all elements with class='tabcontent' and hide them
      $('.tabcontent').hide();

      // Get all elements with class='tablinks' and remove the class 'active'
      $('.tablinks').removeClass('active');

      // Show the current tab, and add an 'active' class to the link that opened the tab
      const tabname = $(e.target).data('tabname');
      $(`#container #${tabname}`).show();

      $(e.target).addClass('active');

      for (let i = 0; i < this.widgets.length; i += 1) {
        this.widgets[i].refresh();
      }
    });

    $('.grid-stack').gridstack(this.options).on('resizestop', () => {
      for (let i = 0; i < this.widgets.length; i += 1) {
        this.widgets[i].refresh();
      }
    });

    $('.widget').each((i, e) => {
      const widgetType = $(e).data('widget-type');
      if (widgetType in this.widgetTypes) {
        this.widgets.push(this.widgetTypes[widgetType]($(e)));
      }
    });

    for (let i = 0; i < this.widgets.length; i += 1) {
      this.widgets[i].render();
    }

    try {
      $('.tablinks.defaultTab')[0].click();
    } catch (t) {
      console.log(t);
    }
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }
}
