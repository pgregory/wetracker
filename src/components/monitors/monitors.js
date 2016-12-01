import $ from 'jquery';

import Signal from '../../utils/signal';
import { state } from '../../state';
import { song } from '../../utils/songmanager';

import monitorsTemplate from './templates/monitors.marko';

import styles from './styles.css';

export default class Monitors {
  render(target) {
    var columns = Math.ceil(song.song.tracks.length / 2.0);
    $(target).append(monitorsTemplate.renderSync({song: song.song, columns}));
  }
}
