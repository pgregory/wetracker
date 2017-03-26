---
title: Monitors
layout: documentation
index: 40
indent: 3
---

Monitors
========
{:style="color: #0074E6"}

This widget serves two purposes. Firstly, it displays a waveform representing
the amplitude changes of a small section of the sound playing on that channel.
Secondly, it provides a convenient user interface to control the playback of
individual channels.

<a href="{{site.baseurl}}/images/monitors.png"><img
src="{{site.baseurl}}/images/monitors.png" style="width: 100%; height: 100%; object-fit: contain;"></a>

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
      <img src="{{site.baseurl}}/images/monitors-mute.png" style="width: 100%; height: 100%; object-fit: contain;">
    </a>
  </div>

* Shift+left click to solo a track. 

  <div style="width: 50%;">
    <a href="{{site.baseurl}}/images/monitors-solo.png">
      <img src="{{site.baseurl}}/images/monitors-solo.png" style="width: 100%; height: 100%; object-fit: contain;">
    </a>
  </div>

  When you solo a track, all other tracks are silenced, only the selected track
  will be heard.  While in solo mode, shift+left clicking on any other track will
  make that one the solo track, silencing the previous one. Shift+left clicking
  again on the solo track will turn off solo mode, and return to the previous
  state, restoring the mute status of any previously muted tracks.

