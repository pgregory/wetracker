import $ from 'jquery';
import 'jquery-ui/core';
import 'jquery-ui/effect';
import 'jquery-ui/effects/effect-blind';

import 'jquery.fancytree/dist/jquery.fancytree-all';
import '../../ui.fancytree.css';

import { song } from '../../utils/songmanager';

import browserTemplate from './templates/browser.marko';

import './styles.css';

/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
/* global __API__:false */

export default class Browser {
  constructor(target) {
    this.target = target;
  }

  render() {
    $(this.target).append(browserTemplate.renderToString());

    const glyphOpts = {
      map: {
        doc: 'fa fa-file',
        docOpen: 'fa fa-file',
        checkboxSelected: 'fa fa-check',
        checkboxUnknown: 'fa fa-share',
        dragHelper: 'fa fa-play',
        dropMarker: 'fa fa-arrow-right',
        error: 'fa fa-warning-sign',
        expanderClosed: 'fa fa-caret-right fa-lg',
        expanderLazy: 'fa fa-caret-right fa-lg',  // fa-plus-sign
        expanderOpen: 'fa fa-caret-down fa-lg',  // fa-collapse-down
        folder: 'fa fa-folder-close',
        folderOpen: 'fa fa-folder-open',
        loading: 'fa fa-spinner fa-spin fa-pulse',
      },
    };

    $(this.target).find('.item-list').fancytree({
      extensions: ['glyph'],
      glyph: glyphOpts,
      icon: (event, data) => {
        if (data.node.isFolder()) {
          return 'fa fa-folder';
        }
        if ('_id' in data.node.data && data.node.data.type === 'song') {
          return 'fa fa-music';
        }
        return false;
      },
      source: [
        { title: 'Demo Songs', folder: true, key: 'demosongs', lazy: true },
      ],
      lazyLoad: (event, data) => {
        const node = data.node;
        data.result = { // eslint-disable-line no-param-reassign
          url: `${__API__}${node.key}`,
        };
      },
      postProcess: (event, data) => {
        data.result = data.response.map((a) => { // eslint-disable-line no-param-reassign
          const item = { title: a.name, _id: a._id, type: 'song' };
          return item;
        });
      },
      dblclick: (event, data) => {
        const node = data.node;

        if ('_id' in node.data) {
          const songfileURL = `${__API__}songs/${node.data._id}/file`;

          try {
            $('#dialog').empty();
            $('#dialog').append($('<p>Loading Song</p>'));
            const dialog = $('#dialog').dialog({
              width: 500,
              modal: true,
            });
            song.downloadSong(songfileURL).then(() => {
              dialog.dialog('close');
            });
          } catch (e) {
            console.log(e);
          }
        }
      },
    });
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }
}
