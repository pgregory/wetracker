import $ from 'jquery';
import 'jstree';
import 'jstree/dist/themes/default-dark/style.css';

import { song } from '../../utils/songmanager';

import browserTemplate from './templates/browser.marko';

/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
/* global __API__:false */

export default class Browser {
  constructor(target) {
    this.target = target;
  }

  render() {
    $(this.target).append(browserTemplate.renderToString());

    $(this.target).find('.item-list').jstree({
      core: {
        themes: {
          name: 'default-dark',
          variant: 'small',
        },
        data: {
          url: `${__API__}songs`,
          type: 'GET',
          dataFilter: (data) => {
            const songs = JSON.parse(data);
            const result = [];
            for (let s = 0; s < songs.length; s += 1) {
              result.push({ text: songs[s].name, _id: songs[s]._id });
            }
            return JSON.stringify({ text: 'Demo Songs', children: result });
          },
        },
      },
    }).on('dblclick', '.jstree-anchor', () => {
      const instance = $.jstree.reference(this);
      const node = instance.get_node(this);
      const songfileURL = `${__API__}songs/${node.original._id}/file`;

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
    });
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }
}
