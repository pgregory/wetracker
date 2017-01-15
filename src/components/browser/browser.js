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
    const songs = [
      { name: "Onward", },
    ];
    $(this.target).append(browserTemplate.renderToString({songs}));

    $(this.target).find('.item-list').jstree({
      "core": {
        "themes": {
          "name": "default-dark",
          "variant": "small",
        },
        "data": {
          "url": "http://localhost:8080/songs",
          "type": "GET",
          "dataFilter": function(data) {
            let songs = JSON.parse(data);
            let result = [];
            for (let s in songs) {
              result.push({ "text": songs[s].name});
            }
            return JSON.stringify({ "text": "Demo Songs", "children": result });
          },
        },
      },
    });
  }

  refresh() {
    $(this.target).empty();
    this.render();
  }
}
