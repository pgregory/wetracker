import $ from 'jquery';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import PatternEditorCanvas from '../pattern_editor/pattern_editor_canvas';
import Monitors from '../monitors/monitors';
import SequenceEditor from '../sequence_editor/sequence_editor';
import InstrumentList from '../instrument_list/instrument_list';
import SampleList from '../sample_list/sample_list';
import SampleEditor from '../sample_editor/sample_editor';
import VolumeEnvelope from '../instrument_editor/volume_envelope';
import PanningEnvelope from '../instrument_editor/panning_envelope';
import InstrumentControls from '../instrument_editor/instrument_controls';
import SampleMapper from '../sample_mapper/sample_mapper';

import tabsTemplate from './templates/tabs.marko';

export default class Tabs {
  constructor(target) {
    this.target = target;
    this.widgets = [];

    this.options = {
        cellHeight: 40,
        verticalMargin: 5,
        resizable: {
          handles: 'n, ne, e, se, s, sw, w, nw'
        },
        width: 50,
        handleClass: 'widget-titlebar',
        alwaysShowResizeHandle: true,
    };

    this.widgetTypes = {
      'pattern-editor': (t) => { return new PatternEditorCanvas(t); },
      'monitors': (t) => { return new Monitors(t); },
      'sequence-editor': (t) => { return new SequenceEditor(t); },
      'instrument-list': (t) => { return new InstrumentList(t) },
      'sample-list': (t) => { return new SampleList(t) },
      'sample-editor': (t) => { return new SampleEditor(t) },
      'volume-envelope': (t) => { return new VolumeEnvelope(t) },
      'panning-envelope': (t) => { return new PanningEnvelope(t) },
      'instrument-controls': (t) => { return new InstrumentControls(t) },
      'sample-mapper': (t) => { return new SampleMapper(t) },
    };
  }

  render() {
    $(this.target).append(tabsTemplate.renderToString());
 
    $(this.target).find('.tablinks').click((e) => {
      // Get all elements with class="tabcontent" and hide them
      $('.tabcontent').hide();

      // Get all elements with class="tablinks" and remove the class "active"
      $('.tablinks').removeClass('active');

      // Show the current tab, and add an "active" class to the link that opened the tab
      const tabname = $(e.target).data('tabname');
      $(`#container #${tabname}`).show();

      $(e.target).addClass('active');

      for (var i = 0; i < this.widgets.length; i += 1) {
        this.widgets[i].refresh();
      }
    });

    $('.grid-stack').gridstack(this.options).on('resizestop', (event, ui) => {
      for(let i = 0; i < this.widgets.length; i += 1) {
        this.widgets[i].refresh();
      }
    });

    $('.widget').each((i, e) => {
      const widgetType = $(e).data('widget-type');
      if (widgetType in this.widgetTypes) {
        this.widgets.push(this.widgetTypes[widgetType]($(e))); 
      }
    });

    for (var i = 0; i < this.widgets.length; i += 1) {
      this.widgets[i].render();
    }

    try {
      $('.tablinks.defaultTab')[0].click();
    } catch (t) {
      console.log(e);
    }
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }
}
