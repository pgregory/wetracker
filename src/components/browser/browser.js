import $ from 'jquery';
import 'jquery-ui/core';
import 'jquery-ui/effect';
import 'jquery-ui/effects/effect-blind';

// import { createTree } from 'jquery.fancytree';
import 'jquery.fancytree/dist/modules/jquery.fancytree.glyph';
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
      preset: 'awesome5',
      map: {
        doc: 'fas fa-file',
        docOpen: 'fas fa-file',
        checkboxSelected: 'fas fa-check',
        checkboxUnknown: 'fas fa-share',
        dragHelper: 'fas fa-play',
        dropMarker: 'fas fa-arrow-right',
        error: 'fas fa-warning-sign',
        expanderClosed: 'fas fa-caret-right fa-lg',
        expanderLazy: 'fas fa-caret-right fa-lg',  // fa-plus-sign
        expanderOpen: 'fas fa-caret-down fa-lg',  // fa-collapse-down
        folder: 'fas fa-folder-close',
        folderOpen: 'fas fa-folder-open',
        loading: 'fas fa-spinner fa-spin fa-pulse fa-lg',
      },
    };

    $(this.target).find('.item-list').fancytree({
      extensions: ['glyph'],
      glyph: glyphOpts,
      icon: (event, data) => {
        console.log(data.node);
        if (data.node.isFolder()) {
          return 'fas fa-folder';
        }
        if ('_id' in data.node.data && data.node.data.type === 'song') {
          return 'fas fa-music';
        }
        return false;
      },
      source: [
        {
          title: 'Demo Songs', folder: true, key: 'demosongs', lazy: true,
        },
      ],
      lazyLoad: (event, data) => {
        const { node } = data;
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
        const { node } = data;

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
            }, (msg) => {
              dialog.dialog('close');
              $('#dialog').empty();
              $('#dialog').append($(`<p>${msg}</p>`));
              const errorDialog = $('#dialog').dialog({
                width: 500,
                modal: true,
                buttons: {
                  OK: () => {
                    errorDialog.dialog('close');
                  },
                },
              });
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
