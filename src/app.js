/* global gapi:false */
import 'babel-polyfill';
import $ from 'jquery';
import 'gridstack';
import 'gridstack/dist/gridstack.css';
import 'font-awesome-webpack';
import 'jquery-ui/widgets/dialog';
import 'jquery-ui/../themes/base/base.css';
import 'jquery-ui/../themes/base/core.css';
import 'jquery-ui/../themes/base/theme.css';
import 'jquery-ui/../themes/base/dialog.css';
import 'jquery-ui/../themes/base/resizable.css';
import MouseTrap from 'mousetrap';
import Director from 'director';
import QueryString from 'query-string';

import Transport from './components/transport/transport';
import Tabs from './components/tabs/tabs';
import Meter from './components/meter/meter';

import gridTemplate from './templates/grid.marko';
import instrumentsViewTemplate from './templates/instrumentsview.marko';

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
    const tabs = new Tabs('#tabs');
    const meter = new Meter('#vumeters');
    let curYPos;
    let curXPos;
    let curDown;

    $('#song-view').append($(gridTemplate.renderToString()));
    $('#instruments-view').append($(instrumentsViewTemplate.renderToString()));

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
        });
      } catch (e) {
        console.log(e);
      }
    }
  };

  const routes = {
    '/loadsong': loadSong,
  };

  const router = Director.Router(routes);

  showWeTrackerInterface();

  router.init();
});

export function gapiLoaded() {
  gapi.client.init({
    apiKey: 'AIzaSyALbx4_dafCGda6bZZ3SGt99yAeL58KJ-8',
    discoveryDocs: [
      'https://people.googleapis.com/$discovery/rest?version=v1',
      'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    clientId: '1059727763451-nh45bf0nv6hka9uknmjpudg17rs6fdu1.apps.googleusercontent.com',
    scope: 'profile https://www.googleapis.com/auth/drive',
  }).then(() => {
    gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
    updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
  });
}

function updateSigninStatus(isSignedIn) {
  console.log(isSignedIn);
  if (isSignedIn) {
    gapi.client.people.people.get({
      resourceName: 'people/me',
    }).then((response) => {
      console.log(`Hello ${response.result.names[0].givenName}`);
      state.set({
        user: {
          loggedIn: true,
          givenName: response.result.names[0].givenName,
        },
      });
    }, (reason) => {
      console.log(`Error: ${reason.result.error.message}`);
    });
  } else {
    state.set({
      user: {
        loggedIn: false,
        givenName: '',
      },
    });
  }
}

window.gapiLoaded = gapiLoaded;

