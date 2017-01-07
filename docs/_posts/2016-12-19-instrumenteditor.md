---
layout: post
title: Fully Operational Instrument Editor
date: 2016-12-19 17:13:00
categories: tracker, fasttracker, webaudio, instruments 
short_description: Another step towards a fully functioning authoring interface,
  introducing a new 'view' and a whole bunch of new widgets to support instrument
  creation and editing.
image_preview: images/instrumenteditor_thumb.png
---

After some frantic "holiday hacking", I've just deployed a major update to the
curent status, the introduction of an instrument editor. 

Until this release, the interface has been squarely defined around song playback
and some editing. I realised that in order to make this a fully self sufficient
editing tool, I needed to address the ability to create and edit instruments
next. 

To support this, I've introduced a change to the user interface paradigm that
has been on my plans for some time. You may have noticed that the interface is
made up of independent "widgets" each can be placed and sized independently to
define a completely custom layout. This has now been extended to support
multiple views or tabs. Below the, now fixed, transport controls there is now a
tab interface, allowing you to switch between views. Currently there are two
fixed views, song and instrument editing, future updates will allow arbitrary
numbers of customisable views.

The new widgets to support instrument editing include a volume and panning
envelope editor, a sample mapping interface, and instrument controls. These can
all be seen in operation in the screenshot below, embedded in the new view.

<a href="{{site.baseurl}}/images/instrumenteditor.png">
  <img src="{{site.baseurl}}/images/instrumenteditor.png" style="width: 100%;"/>
</a>

The current test release on Heroku includes this new set of features, so please
pop by and kick the tyres. Operation is pretty simple in most cases. Most
widgets can be scrolled and zoomed with the mouse wheel and left/rigth scrolling
where available. The envelopes can be edited by dragging the points, shift click
will insert a new point at the crosshairs, which automatically adjust to show
where on the current curve a new point will be inserted, and alt-click deletes
the point under the mouse. The sample mapper is similar, shift click will split
a segment at the mouse, the single button in the control panel, "Set" will set
the sample number for the selected segment, dragging on the boundary of a
segment will move it. The graph shows the notes from C-0 to B-7 in octaves, the
current sample number in use in a segment is shown in green, any notes played in
that region will trigger that sample number.

Lots more to do here I'm sure, but basic operation is there, creating
instruments, loading samples (.wav and .mp3 tested), and mapping keys, enough to
get started creating new instruments.


Onwards and upwards.
