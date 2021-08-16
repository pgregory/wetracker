import 'core-js/stable';
import 'regenerator-runtime/runtime';
import $ from 'jquery';
import 'gridstack';
import 'gridstack/dist/gridstack.css';
import 'gridstack/dist/h5/gridstack-dd-native';
import '@fortawesome/fontawesome-free/js/fontawesome';
import '@fortawesome/fontawesome-free/js/solid';
import '@fortawesome/fontawesome-free/js/regular';
import '@fortawesome/fontawesome-free/js/brands';
import 'jquery-ui/widgets/dialog';
import 'jquery-ui/../themes/base/base.css';
import 'jquery-ui/../themes/base/core.css';
import 'jquery-ui/../themes/base/theme.css';
import 'jquery-ui/../themes/base/dialog.css';
import 'jquery-ui/../themes/base/resizable.css';
import MouseTrap from 'mousetrap';
import { Router } from 'director/build/director';
import QueryString from 'query-string';

import Transport from './components/transport/transport';
import Tabs from './components/tabs/tabs';
import Meter from './components/meter/meter';

import './controls.css';

import { song } from './utils/songmanager';
import { state } from './state';
import { player } from './audio/player';

// Importing these is enough to instantiate the singelton and therefore
// bind the key handlers.
import './utils/virtualkeyboard';
import './utils/hexinput';
import './utils/fxinput';

import './styles.css';

$(document).ready(() => {
  const showWeTrackerInterface = () => {
    const transport = new Transport('#transport');
    const tabs = new Tabs('#tabheader');
    const meter = new Meter('#vumeters');
    let curYPos;
    let curXPos;
    let curDown;

    // $('#song-view').append($(gridTemplate.renderToString()));
    // $('#instruments-view').append($(instrumentsViewTemplate.renderToString()));

    MouseTrap.bind('space', (e) => {
      if (player.playing) {
        player.pause();
      } else {
        state.set({
          cursor: {
            record: !state.cursor.get('record'),
          },
        });
      }
      e.preventDefault();
    });

    MouseTrap.bind('enter', (e) => {
      if (!player.playing) {
        player.play();
      } else {
        player.pause();
      }
      e.preventDefault();
    });

    MouseTrap.bind('mod+z', () => {
      state.undo();
    });

    MouseTrap.bind('shift+mod+z', () => {
      state.redo();
    });

    transport.refresh();

    tabs.refresh();
    tabs.loadDefaultLayout();

    meter.refresh();

    song.newSong();

    state.set({
      transport: {
        masterVolume: -10.0,
      },
    });

    $('body').on('mousemove', (e) => {
      if (curDown) {
        window.scrollTo(document.body.scrollLeft + (curXPos - e.pageX), document.body.scrollTop + (curYPos - e.pageY));
      }
    });

    $('.sidebar.left').on('mousedown', (e) => {
      curYPos = e.pageY;
      curXPos = e.pageX;
      curDown = true;
    });

    $('body').on('mouseup', () => {
      curDown = false;
    });
  };

  const loadSong = () => {
    const qs = QueryString.parse(location.hash.split('?')[1]);
    if (qs.url) {
      try {
        $('#dialog').empty();
        $('#dialog').append($('<p>Loading Song</p>'));
        const dialog = $('#dialog').dialog({
          width: 500,
          modal: true,
        });
        const url = decodeURIComponent(qs.url);
        song.downloadSong(url).then(() => {
          dialog.dialog('close');
          if (qs.play) {
            window.setTimeout(() => {
              player.play();
            }, 2000);
          }
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
  };

  const routes = {
    '/loadsong': loadSong,
  };

  const router = Router(routes);

  showWeTrackerInterface();

  router.init();
});
