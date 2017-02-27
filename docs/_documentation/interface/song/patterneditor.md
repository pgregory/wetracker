---
title: Pattern Editor
layout: documentation
index: 70
indent: 3
---

Pattern Editor
==============
{:style="color: #0AE200"}

<figure style="float: right; width: 300px;">
  <a href="{{site.baseurl}}/images/patterneditor.png">
    <img src="{{site.baseurl}}/images/patterneditor.png" width="100%"/>
  </a>
  <figcaption>Fig1. - The Pattern Editor</figcaption>
</figure>
The pattern editor is the core of the song creation process. A pattern consists
or rows of events per track, each event can contain any combination of a note
trigger, with optional instrument number, a volume effect command and a general
effect command. The pattern editor widget is the main editing interface for
this data. The event data is displayed in a table form, with each main
separated column representing a track. Within the track are columns for the
note data, instrument data, volume, and effect data, as shown in Fig2.
<figure style="float: right;">
  <a href="{{site.baseurl}}/images/event.png">
    <img src="{{site.baseurl}}/images/event.png" width="100%"/>
  </a>
  <figcaption>Fig2. - Event elements</figcaption>
</figure>
For the purpose of editing there is a cursor in the pattern editor, identified by
a transparent green square over a single event item. The arrow keys can be used
to move the cursor around in the pattern editor. The current line in the
pattern is highlighted by a blue bar, the editor is designed to keep the
current row in the middle of the view at all times, the pattern will scroll
through this marker as the cursor is moved up and down. 
<figure style="float: left;">
  <a href="{{site.baseurl}}/images/patterncursor.png">
    <img src="{{site.baseurl}}/images/patterncursor.png" width="100%"/>
  </a>
  <figcaption>Fig3. - The pattern cursor</figcaption>
</figure>
The cursor itself will change size depending on the item it is over. For
example, a single keypress is used to alter the value of the entire note item,
so the cursor will not adapt to the individual 3 characters that make up the
note item, more on this later, whereas the volume, instrument and effects items
are edited as individual characters.

In order to make any changes to the pattern, the system must first be put into
"edit" mode, this is achieved by pressing the space key, and is indicated by a
red border around the widget. When in edit mode, keys pressed will enter or
overwrite data in the pattern at the current cursor position, depending on the
item the cursor is currently on.

Note

: Pressing keys on the virtual keyboard will insert the appropriate note, in
the right octave into the pattern at that position. By default, the currently
selected instrument in the instrument list will be added to the instrument item
at the same time.

Instrument

: The instrument number can be edited independently to manually choose the
instrument separately from the note entry described above. The note instrument
is a hexadecimal, or base 16 number, that is each of the two digits can be 0-9
or A-F, pressing the letter keys for a through f will be sufficient, no shift
for capitalisation is necessary.

Volume

: The volume effect item is in two parts, the first character defines the
volume effect type, the second is a hexadecimal digit that provides the value
for the effect. See volume effects for a reference of the types.

Effects

: The effect item is in two parts, the first digit is a character that
identifies the effect type, the second and third form a hexadecimal number that
provides a value for the effect. See standard effects for a reference of the
effect types and values.

Normally, whenever a new value is entered into an item, the cursor moves down
by the number of rows defined in the step field of the pattern editor. This
makes it easy to enter notes and effects at regular intervals.
