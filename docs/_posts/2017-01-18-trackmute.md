---
layout: post
title: Improved Track Mute Controls
date: 2017-01-18 22:44:00
categories: tracker, interface, monitors, mute, solo 
short_description: Adding enhanced controls to the monitors to enable and disable playback at the track level.
image_preview: images/track_mute_thumb.png
---

For some time the monitors have included basic control of the track mute
states. I've now updated the interface to provide much more control over this
aspect of playback, which gives much more user friendly ability to isolate
tracks when creating complex compositions.

All aspcts o this are controlled through the monitors widget, clicking on
tracks will change the state of the track that it refers to. To make this
easier, each monitor display has been enhanced with the track name. 

 - Left Click - Mute/Unmute the channel
 - Shift + Left Click - Solo/Unsolo the selected channel.

While the interactions are quite simple, the system is a little more involved,
mostly in ways that the user won't see, but it is worth explaining the
operation a little, basic understanding of this will help make sense of some of
the ways it works.

Basically, the track states are stored in a stack. That is, when you change
state, by Left Clicking a track for example, it pushes the current state down a
list for that track, and creates a new state at the top, describing to the
system the behaviour of the track, in this case, that it is muted. When you
reverse the current state on the track, by Left Clicking again, the top state
is discarded, and the previous state is restored, i.e. not muted.

This works for solo mode as well, however a Shift + Left Click interaction
will affect the state stack for all tracks. If you click on channel 2 with
Shift held, it will push the current state for all tracks, for tracks other
than 2 it will set the new top state to silent, for track 2 it will set it to
solo. Again, Shift + Left Clicking on the same track will reverse the state
change, discarding the top state, and restoring the previous state for all
tracks.

Using the stack approach like this gives the system inherent history, it knows
about previos status and will restore as it changes. For example, if you mute
some tracks, then solo another, when you un-solo that track, the previously
muted tracks will remain muted. Another cool side-effect, you can solo a track,
then Shift + Left Click to solo a different one, when you Shift + Left Click on
the second solo'd track again to un-solo it, the previous solo'd track will be
solo'd again, so you can quickly swap solo between two tracks just by
repeatedly Shift + Left Clicking on the second track.

One more interface change to support this new capability, the pattern editor
has been updated to fade out tracks that are muted or silent.

See the screen capture below showing the features of the new system described
above.

<video autoplay>
  <source src="{{site.baseurl}}/images/muting.webm" type='video/webm;
codecs="vp8"'/>
  <img src="{{site.baseurl}}/images/muting.gif"/>
</video>

Onwards and upwards...
