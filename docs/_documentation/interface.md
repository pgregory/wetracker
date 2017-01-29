---
title: Interface
layout: documentation
index: 20
---

WeTracker Interface
===================

WeTracker is a single page application, organsed as a series of tab views, each
containing a number of 'widgets' organised in a grid in the view. Each widget
in the the interface is independently placed within a grid layout. You can
reorganise the widgets in any way that suits your working preferences. Each
widget has a border, in each corner you'll see a small arrow icon. Select and
drag on any of these to resize the widget. 
<a href="{{site.baseurl}}/images/dragwidget.png"><img style="float: right;"
src="{{site.baseurl}}/images/dragwidget.png" width="200px"/></a>
The neigbouring widgets will move to compensate for the change. Widgets cannot
go beyond the bounds of the screen horizontally, but the space will grow
vertically to accept the new layout.  Grabbing the header bar of the widget
will allow you to move it freely within the grid. Again, other widgets will
automatically move to accommodate the new layout. While dragging, the final
location of the widget will be displayed as a dotted line, allowing you to see
the effect of your change before dropping it.

**Note:** The widget layout is not stored between sessions
at this time, any changes made will be lost the next time you refresh the
application.  
{: .t-hackcss-note }

**Note:** It is not possible to add or remove widgets from a
layout at this time.
{: .t-hackcss-note }

<a href="{{site.baseurl}}/images/interface1.png">
  <img src="{{site.baseurl}}/images/interface1.png" width="100%"/>
</a>

## Transport
{:style="color: #E5D964"}

At the top of the screen is the Transport, this is a fixed set of controls that
are generally useful irresepctive of which tab you're currently working in.

![new]({{site.baseurl}}/images/new_song_icon.png) **Reset**
: Reinitialise the application to the default state, with an empty song and two
  sample instruments.

![save]({{site.baseurl}}/images/save_song_icon.png) **Save**
: Download your current song as WeTracker JSON format.

![load]({{site.baseurl}}/images/load_song_icon.png) **Load**
: Load a song, in WeTracker JSON format or FastTrackerII .xm format.

![play]({{site.baseurl}}/images/play_icon.png) **Play**
: Begin playing the whole song from the start.  

![play pattern]({{site.baseurl}}/images/play_pattern_icon.png) **Play Pattern**
: Play the current pattern in a continuous cycle.

![pause]({{site.baseurl}}/images/pause_icon.png) **Pause**
: Pause playback.

![stop]({{site.baseurl}}/images/stop_icon.png) **Stop**
: Stop playback and reset play position, also stops any looping instruments that
  have been triggered from the keyboard.

![restart]({{site.baseurl}}/images/play_icon.png) **Restart**
: Go back to the start of the song.

![octave]({{site.baseurl}}/images/octave_control.png) **Octave**
: Change the octave that the keyboard plays, this is the octave that the 'Z' key
  will play a C note in.

![speed]({{site.baseurl}}/images/speed_control.png) **Speed**
: Change the speed of the song, this is effectively the number of ticks per row,
  higher will have the effect of slowing the song down but give more control over
  effects between rows.

![bpm]({{site.baseurl}}/images/bpm_control.png) **BPM**
: Change the number of beats/rows per minute, use in combination with speed to
get the song playback speed.

![volume]({{site.baseurl}}/images/volume_control.png) **Master Volume**
: Master playback volume, affects all tracks.

You can edit the octave values in the Transpora directlt, or use """ and "|" to
increment and decrement the current octave value.


## Monitors
{:style="color: #0074E6"}

This widget serves two purposes. Firstly, it displays a waveform representing
the amplitude changes of a small section of the sound playing on that channel.
Secondly, it provides a convenient user interface to control the playback of
individual channels.

<a href="{{site.baseurl}}/images/monitors.png"><img
src="{{site.baseurl}}/images/monitors.png" width="100%"></a>

Each square section of the monitor widget represents a track in the pattern
editor, identified by the name displayed in the top left corner. The graph
shows approximately 23ms of the final sound playing on that track, after all
effects and controls are applied, basically what comes out of the track and is
sent to the master sound output.

Using the mouse, you can control the state of these tracks by clicking on the
squares representing the tracks. 

* Left click to mute a track, and then again to unmute it.

  <div style="width: 50%;">
    <a href="{{site.baseurl}}/images/monitors-mute.png">
      <img src="{{site.baseurl}}/images/monitors-mute.png" width="100%">
    </a>
  </div>

* Shift+left click to solo a track. 

  <div style="width: 50%;">
    <a href="{{site.baseurl}}/images/monitors-solo.png">
      <img src="{{site.baseurl}}/images/monitors-solo.png" width="100%">
    </a>
  </div>

  When you solo a track, all other tracks are silenced, only the selected track
  will be heard.  While in solo mode, shift+left clicking on any other track will
  make that one the solo track, silencing the previous one. Shift+left clicking
  again on the solo track will turn off solo mode, and return to the previous
  state, restoring the mute status of any previously muted tracks.

## Instruments
{:style="color: #FF3B3B"}


## Sequence
{:style="color: #5D56E9"}


## Pattern Editor
{:style="color: #0AE200"}


## Browser
{:style="color: #0BD7E4"}


## Effects
{:style="color: #FF76E1"}
