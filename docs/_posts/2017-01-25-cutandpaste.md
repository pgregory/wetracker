---
layout: post
title: Cut and Paste
date: 2017-01-25 23:54:00
categories: tracker 
short_description: Implementing cut and paste in the pattern editor.
image_preview: images/cutandpaste_thumb.png
---

The editing capabilities of WeTracker continue to evolve, as I endeavour to
provide the tools needed to be efficient as a tracker tool. This recent change
introduces cut&paste, or more accurately right now, copy&paste. 

Supporting this feature is another new capability that will be expanded upon in
the coming releases, the ability to mark a region of the data in the pattern
editor. There has always been the concept of a current cursor in the pattern
editor, displayed as a green marker on the item that it marks. Now this concept
has been expanded to allow you to effectively 'hold' the cursor, and move it
resulting in a region being highlighted. This is achieved by moving to where
you want to start marking the region using the cursor keys as normal, then
pressing and holding shift and moving the cursor to the end point of the region
to be selected. The cursor can be moved in any direction from the start point,
the system copes with backwards/upwards motion fine. The total region will be
highlighted with a semi-transparent green rectangle.

Once you have selected your region of the pattern, pressing CTRL+C/CMD+C will
copy the contents of that region into an internal buffer. You can then move to
anywhere in the pattern and press CTRL+V/CMD+V to paste the contents. The copy
and paste operations are intelligent enough to know where in the tracks the
data comes from and only paste where it is appropriate. This means, for
example, you can copy rows from the FX column, then move to any other track, or
anywhere else in the same track, and press CTRL+V/CMD+V and the data will paste
into the FX column starting from that row, in that track, no need to move the
cursor to the FX column to paste.

When copying and pasting, if the region doesn't include all elements of an
event, i.e. note, instrument, volume, and FX, the missing parts will not be
modified when pasting. If however, the region includes those elements but they
are empty, when pasting, any data in those elements in the target region will
be replaced with empty elements. This allows you to exactly copy and paste
regions, including empty data, or copy and paste just certain parts of the
pattern.

The screen capture below shows some of the features described above in action.
Astute readers will also notice that undo works fine with cut&paste too.

<video autoplay>
  <source src="{{site.baseurl}}/images/cutandpaste.webm" type='video/webm;
codecs="vp8"'/>
  <img src="{{site.baseurl}}/images/cutandpaste.gif"/>
</video>

Onwards and upwards...
