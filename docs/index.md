---
layout: default
---

WeTracker
=========

Collaborative, Online, Music Suite

What is WeTracker
-----------------

**WeTracker** is an online music creation suite in the vein
of music trackers, such as [SoundTracker](http://www.soundtracker.org), 
[FastTracker2](https://en.wikipedia.org/wiki/FastTracker_2) and the like.

<div style="display:flex;">
    <div style="margin: 3px;">
      <a href="{{site.baseurl}}/images/screenshot.png">
        <img src="{{site.baseurl}}/images/screenshot.png" width="100%"/>
      </a>
    </div>
    <div style="margin: 3px;">
      <a href="{{site.baseurl}}/images/screenshot2.png">
        <img src="{{site.baseurl}}/images/screenshot2.png" width="100%"/>
      </a>
    </div>
</div>

Status
------

Currently very much work in progress, early in development. Feel free
to stop by the [github project](https://github.com/pgregory/wetracker) and 
give me some feedback, ideas and suggestions welcome. 
Contributions are also welcome, just clone and submit a pull request.

The project has recently undergone a complete foundational reboot, see [this
post]({{site.baseurl}}{% post_url 2016-11-28-reboot %}) for more details.
The video that used to be linked here is no longer representative, so has been
removed, a new screencast will be uploaded when the new functionality reaches a
point where it's worthwhile capturing.

Development requires Node, tested with v7.1.0, and npm, tested with 3.10.9.

To try it out for yourself, just clone the github repo, run

```
npm install
npm run start
```

New: The current development status is being deployed to a test server on
Heroku. I'll update this periodically as new worthwhile functionality becomes
available.

[WeTracker Demo](https://wetracker.herokuapp.com/)

Try loading some songs from 
[Modland.com](http://modland.com/pub/modules/Fasttracker%202/) to test it out,
many work, some don't. If you find one that doesn't let me know and I'll add it
to the test list to be reviewed.

Basic operation: It starts with an empty song, one pattern and a couple of
sample instruments. 

You can make any changes you like to the pattern, the keyboard will be familiar
to anyone who has use FastTracker2.

```
  Z,X,C,V,B,N,M = C,D,E,F,G,A,B 
  S,D = C#, D#
  G,H,J = F#, G#, A#
  Q,W,E,R,T,Y,U = C,D,E,F,G,A,B one octave up
  2,3 = C#, D# one octave up
  5,6,7 = F#, G#, A# one octave up
  
  0-9 A-F = Hex input on all other event elements
  Delete = Deletes the item under the cursor
```  

In order to record new data into the current pattern, you need to enable
'record mode'. When you press the spacebar, the pattern editor widget border
will change to red to indicate record mode, you can now record notes and effect
changes into the pattern with the keyboard.

The seqence editor widget to the left of the pattern editor has basic controls
to add a new pattern after the current cursor, duplicate the current pattern,
add a new sequence entry pointing to the current pattern, and delete the
current sequence entry.

The interface is split into multiple views of widgets, the first page is the
song editore, there is a tab bar below the main transport controls to switch to
another view, the instrument editor. Here you can create new instruments, add
samples to an instrument and load .wav or .mp3 files (or anything else that
WebAudio supports), add and edit volume and/or panning envelopes, edit loop
type and loop points of samples, and assign samples to different ranges of note
input.

The envelope editor allows you to make interactive changes to either the volume
or panning envelope, shift-click to add a new point at the crosshairs, which
will follow the curve as you move over it. Alt-click to delete a point.

The sample map is similar, scroll to zoom, shift-click to add a separator, drag
the separator line to move it through the octaves and notes. To assign a sample
to a range, select the range, and then select the sample in teh sample list,
and click "Set" in the sample map widget to assign that sample to the range of
notes.

The transport has some basic functionality.

* ![new]({{site.baseurl}}/images/new_song_icon.png) - Reset
  to the default empty song.
* ![save]({{site.baseurl}}/images/save_song_icon.png) -
  Download your current song as WeTracker JSON format.
* ![load]({{site.baseurl}}/images/load_song_icon.png) - Load
  a song, in WeTracker JSON format or FastTrackerII .xm format.
* ![play]({{site.baseurl}}/images/play_icon.png) - Play the
  song from the current position.  
* ![play pattern]({{site.baseurl}}/images/play_pattern_icon.png) -
  Play the current pattern in a continuous cycle.
* ![pause]({{site.baseurl}}/images/pause_icon.png) - Pause
  playback.
* ![stop]({{site.baseurl}}/images/stop_icon.png) - Stop
  playback and reset play position, also stops any looping instruments that
  have been triggered from the keyboard.
* ![restart]({{site.baseurl}}/images/play_icon.png) - Go back
  to the start of the song.
* ![octave]({{site.baseurl}}/images/octave_control.png) - Change the octave
  that the keyboard plays, this is the octave that the 'Z' key will play a C
  note in.
* ![speed]({{site.baseurl}}/images/speed_control.png) - Change the speed of the
  song, this is effectively the number of ticks per row, higher will have the
  effect of slowing the song down but give more control over effects between
  rows.
* ![bpm]({{site.baseurl}}/images/bpm_control.png) - Change the number of
  beats/rows per minute, use in combination with speed to get the song playback
  speed.
* ![volume]({{site.baseurl}}/images/volume_control.png) - Master playback
  volume, affects all tracks.

You can edit the octave values in the toolbar, or use """ and "|" to increment
and decrement octave.

The row step for entering notes can be found in the pattern editor, and can be
changed using the "{" and "}" keys.

