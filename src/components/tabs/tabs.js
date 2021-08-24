import $ from 'jquery';

import { GridStack } from 'gridstack';
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
import EffectsEditor from '../effects_editor/effects_editor';
import Browser from '../browser/browser';

import './styles.css';

import tabsTemplate from './templates/tabs.marko';
import tabTemplate from './templates/tab.marko';
import widgetTemplate from './templates/widget.marko';
import tabHeaderTemplate from './templates/tab_header.marko';

import defaultLayout from '../../default_layout.json';
import DB from '../../utils/indexeddb';

export default class Tabs {
  constructor(target) {
    this.target = target;
    this.widgets = [];
    this.tabs = [];

    this.totalHeight = (window.innerHeight - 1) - 62;

    this.options = {
      cellHeight: (this.totalHeight - (5 * 2)) / 8,
      margin: 2,
      resizable: {
        handles: 'ne, se, sw, nw',
      },
      handleClass: 'widget-titlebar',
      alwaysShowResizeHandle: true,
    };

    this.widgetTypes = {
      'pattern-editor': (t) => new PatternEditorCanvas(t),
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

    window.addEventListener('resize', () => {
      this.totalHeight = (window.innerHeight - 1) - 62;
      const cellHeight = (this.totalHeight - (5 * 2)) / 8;
      this.tabs.forEach((tab) => {
        tab.grid.cellHeight(cellHeight);
      });
    });
  }

  render() {
    $(this.target).append(tabsTemplate.renderToString());

    $(this.target).find('#tab-menu').on('click', () => {
      $('#tab-menu-content').toggleClass('show');
      $('#tab-menu .background-overlay').toggleClass('show');
    });

    $(this.target).find('#save-layout').on('click', async (e) => {
      await this.saveLayout();
      $('#tab-menu-content').removeClass('show');
      $('#tab-menu .background-overlay').removeClass('show');
      e.preventDefault();
      e.stopPropagation();
    });

    $(this.target).find('#load-layout').on('click', async (e) => {
      await this.loadLayout();
      $('#tab-menu-content').removeClass('show');
      $('#tab-menu .background-overlay').removeClass('show');
      e.preventDefault();
      e.stopPropagation();
    });

    $(this.target).find('#default-layout').on('click', (e) => {
      $('#tab-menu-content').removeClass('show');
      $('#tab-menu .background-overlay').removeClass('show');
      this.loadDefaultLayout();
      e.preventDefault();
      e.stopPropagation();
    });

    $(this.target).find('.tablinks').on('click', (e) => {
      // Get all elements with class='tablinks' and remove the class 'active'
      $('.tablinks').removeClass('active');

      $(e.target).addClass('active');

      // Get all elements with class='tabcontent' and hide them
      $('.tabcontent').hide();
      const tabName = $(e.target).data('tabname');
      $(`#tabscontainer #${tabName}`).show();

      for (let i = 0; i < this.widgets.length; i += 1) {
        this.widgets[i].refresh();
      }
    });
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }

  async loadLayout() {
    const layout = await DB.loadFromIndexedDB('settings', 'layout')
      .catch((error) => {
        console.error(error.message);
      });
    this.applyLayout(layout.layout);
  }

  async saveLayout() {
    const result = [];
    this.tabs.forEach((tab) => {
      const gridItems = tab.grid.getGridItems();
      const widgets = gridItems.map((item) => ({
        x: item.gridstackNode.x,
        y: item.gridstackNode.y,
        w: item.gridstackNode.w,
        h: item.gridstackNode.h,
        type: $(item.gridstackNode.el).find('.widget').data('widgetType'),
        title: 'test',
      }));
      const tabData = {
        title: tab.tabName,
        tabName: tab.tabName,
        widgets,
      };
      result.push(tabData);
    });
    await DB.saveToIndexedDB('settings', { id: 'layout', layout: result });
  }

  applyLayout(layout) {
    this.tabs = [];
    // Remove existing tabs
    $(this.target).find('#tabs').empty();
    $('#tabscontainer').empty();
    layout.forEach((tab) => {
      console.log(`Creating tab ${tab.tabName}`);

      const tabHeader = tabHeaderTemplate.renderSync({ title: tab.title, tabName: tab.tabName });
      $(tabHeader.getNode().querySelector(`#${tab.tabName}-header`)).on('click', (e) => {
        // Get all elements with class='tablinks' and remove the class 'active'
        $('.tablinks').removeClass('active');
        $(e.target).addClass('active');

        // Get all elements with class='tabcontent' and hide them
        $('.tabcontent').hide();
        $(`#tabscontainer #${tab.tabName}`).show();

        for (let i = 0; i < this.widgets.length; i += 1) {
          this.widgets[i].refresh();
        }
      });
      tabHeader.appendTo($('#tabs')[0]);

      const tabContent = tabTemplate.renderSync({});
      tabContent.getNode().querySelector('.grid-stack').id = tab.tabName;
      tabContent.appendTo($('#tabscontainer')[0]);
      const tabContainer = $('#tabscontainer .grid-stack').last();
      tabContainer.hide();
      const grid = GridStack.init(this.options, tabContainer[0]);

      tab.widgets.forEach((w) => {
        const widgetHTML = widgetTemplate.renderToString({
          title: w.title,
          type: w.type,
        });
        grid.addWidget({
          x: w.x, y: w.y, w: w.w, h: w.h, content: widgetHTML,
        });
        const widgetContainer = tabContainer.find('.widget').last();
        const widgetContent = this.widgetTypes[w.type]($(widgetContainer));
        widgetContent.refresh();
        this.widgets.push(widgetContent);
      });

      grid.on('resizestop', () => {
        for (let i = 0; i < this.widgets.length; i += 1) {
          this.widgets[i].refresh();
        }
      });

      this.tabs.push({
        tabName: tab.tabName,
        contents: tabContainer,
        grid,
      });
    });
    $('#tabscontainer .grid-stack').first().show();
  }

  loadDefaultLayout() {
    this.applyLayout(defaultLayout);
  }
}
