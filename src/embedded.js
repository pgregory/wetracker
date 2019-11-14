import $ from 'jquery';

import { song } from './utils/songmanager';
import { player } from './audio/player';

$(document).ready(() => {
  const loadSong = (url) => {
    try {
      song.downloadSong(url).then(() => {}, (msg) => {
        alert(`${msg}`); // eslint-disable-line no-alert
      });
    } catch (e) {
      console.log(e);
    }
  };

  const playSong = () => {
    player.startPlaying();
  };

  const pauseSong = () => {
    player.pause();
  };

  const stopSong = () => {
    player.stop();
  };

  const resetSong = () => {
    player.reset();
  };

  window.modPlayer = {
    loadSong,
    playSong,
    pauseSong,
    stopSong,
    resetSong,
  };
});
