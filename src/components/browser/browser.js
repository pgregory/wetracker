import $ from 'jquery';
import 'jstree';
import 'jstree/dist/themes/default-dark/style.css';

import MouseTrap from 'mousetrap';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import browserTemplate from './templates/browser.marko';

import styles from './styles.css';

export default class Browser {
  constructor(target) {
    this.target = target;
  }

  render() {
    $(this.target).append(browserTemplate.renderToString());

    $(this.target).find('.item-list').jstree({
      "core": {
        "themes": {
          "name": "default-dark",
          "variant": "small",
        },
        "data": {
          "url": __API__ + "songs",
          "type": "GET",
          "dataFilter": function(data) {
            let songs = JSON.parse(data);
            let result = [];
            for (let s in songs) {
              result.push({ "text": songs[s].name, "_id": songs[s]._id });
            }
            return JSON.stringify({ "text": "Demo Songs", "children": result });
          },
        },
      },
    }).on('dblclick','.jstree-anchor', function (e) {
      let instance = $.jstree.reference(this);
      let node = instance.get_node(this);
      let songfileURL = `${__API__}songs/${node.original._id}/file`;
      song.downloadSong(songfileURL);
    });
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }
}
