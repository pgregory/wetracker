import $ from 'jquery';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import PatternEditorCanvas from '../pattern_editor/pattern_editor_canvas';
import Monitors from '../monitors/monitors';
import SequenceEditor from '../sequence_editor/sequence_editor';
import InstrumentList from '../instrument_list/instrument_list';
import SampleEditor from '../sample_editor/sample_editor';
import InstrumentEditor from '../instrument_editor/instrument_editor';

import tabsTemplate from './templates/tabs.marko';

//import styles from './styles.css';

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
        handleClass: 'widget-titlebar',
        alwaysShowResizeHandle: true,
    };

    this.widgetTypes = {
      'pattern-editor': (t) => { return new PatternEditorCanvas(t); },
      'monitors': (t) => { return new Monitors(t); },
      'sequence-editor': (t) => { return new SequenceEditor(t); },
      'instrument-list': (t) => { return new InstrumentList(t) },
      'sample-editor': (t) => { return new SampleEditor(t) },
      'instrument-editor': (t) => { return new InstrumentEditor(t) },
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

    $('.grid-stack').gridstack(this.options).on('resizestop', function(event, ui) {
      /*for(let i = 0; i < this.widgets.length; i += 1) {
        this.widgets[i].refresh();
      }*/
    }).on('change', function(event, items) {
      console.log("Changed");
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
