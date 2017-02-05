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

import gridTemplate from './templates/grid.marko';
import instrumentsViewTemplate from './templates/instrumentsview.marko';

import './controls.css';

import { song } from './utils/songmanager';
import { state } from './state';
import { cursor } from './utils/cursor';
import { player } from './audio/player';

// Importing these is enough to instantiate the singelton and therefore
// bind the key handlers.
import './utils/virtualkeyboard';
import './utils/hexinput';
import './utils/fxinput';

import './styles.css';

$(document).ready(() => {

  let showWeTrackerInterface = function() {
    let transport = new Transport("#transport");
    let tabs = new Tabs("#tabs");

    $('#song-view').append($(gridTemplate.renderToString()));
    $('#instruments-view').append($(instrumentsViewTemplate.renderToString()));

    MouseTrap.bind("space", (e) => {
      state.set({
        cursor: {
          record: !state.cursor.get("record"),
        }
      });
      e.preventDefault();
    });

    MouseTrap.bind("mod+z", (e) => {
      state.undo();
    });

    MouseTrap.bind("shift+mod+z", (e) => {
      state.redo();
    });

    window.requestAnimationFrame(() => {
      transport.refresh();
      tabs.refresh();

      song.newSong();

      state.set({
        transport: {
          masterVolume: -10.0,
        }
      });

    });

    var curYPos, curXPos, curDown;

    $('body').on('mousemove', function(e){ 
      if(curDown){
        window.scrollTo(document.body.scrollLeft + (curXPos - e.pageX), document.body.scrollTop + (curYPos - e.pageY));
      }
    });

    $('.sidebar.left').on('mousedown', function(e){ 
      curYPos = e.pageY; 
      curXPos = e.pageX; 
      curDown = true; 
    });

    $('body').on('mouseup', function(e){ 
      curDown = false; 
    });

  };

  let loadSong = function() {
    const qs = QueryString.parse(location.hash.split('?')[1]);
    if(qs.url) {
      try {
        $( "#dialog" ).empty();
        $( "#dialog" ).append($("<p>Loading Song</p>"));
        const dialog = $( "#dialog" ).dialog({
          width: 500,
          modal: true,
        });
        const url = decodeURIComponent(qs.url);
        song.downloadSong(url).then(function() {
          dialog.dialog( "close" );
          if(qs.play) {
            window.setTimeout(() => {
              player.play();
            }, 2000);
          }
        });
      } catch(e) {
        console.log(e);
      }
    }
  };

  let routes = {
    '/loadsong': loadSong,
  };

  let router = Director.Router(routes);

  showWeTrackerInterface();

  router.init();
});

