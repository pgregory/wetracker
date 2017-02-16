---
title: Sequence
layout: documentation
index: 60
indent: 3
---

Sequence
========
{:style="color: #5D56E9"}

<a href="{{site.baseurl}}/images/sequence.png" style="float: right; width:
150px;"><img src="{{site.baseurl}}/images/sequence.png" width="100%"/></a>
This widget displays the sequence of patterns that form the song. Each pattern
is a set of instruction rows (see [Pattern Editor]({{site.baseurl}}/documentation/interface/song/patterneditor){: style="color:#0AE200"}), the 
sequence defines the order that these patterns are played in. 

The sequence editor widget consists of two main areas, the sequence list and
the control panel.

Sequence List
-------------

The sequence list consists of two columns, the first column is the sequence
index, the second, the pattern number to play at that point in the sequence.
The sequence numbers are fixed, incrementing. As you add new items in the
sequence, the list grows automatically. The pattern numbers can be modified
freely. This allows you to control the sequence of patterns, including
repeating certain patterns, and playing in different orders. The current
position in the sequence is highlighted by a grey border. In the image shown,
the song is currently at position 4, which is pattern number 99. 

The sequence list can be scrolled using the mouse wheel or touchpad, the
interface will keep the current entry in the middle of the widget, and scroll
the list through the current selection marker. As the sequence is scrolled, the
[Pattern Editor]({{site.baseurl}}/documentation/interface/song/patterneditor){:
style="color:#0AE200"} will update to show the referenced pattern.

Control Panel
-------------

The control panel contains buttons to modify and extend the pattern sequence.
From the top to the bottom.

![add]({{site.baseurl}}/images/addtosequence.png) **Add To Sequence**
: Add a new entry to the sequence table below the currently selected sequence
position and set the pattern to the next available new pattern index,
effectively creating a new empty pattern.

![remove]({{site.baseurl}}/images/removefromsequence.png) **Remove From Sequence**
: Remove the currently selected entry from the sequence list. The sequence
table is shifted, keeping the remaining pattern numbers untouched. This does
not currently delete the pattern from the song, if there are instructions in
the removed pattern, should that pattern be used in another sequence index,
using the increment and decrement buttons, the instructions will still be
there.

![increment]({{site.baseurl}}/images/incrementpattern.png) **Increment Pattern**
: Increment the pattern index at the current sequence position. As the pattern
index is incremented, if the pattern already exists, that pattern will be used.
If there was previously no pattern with that number in the song, a new, empty
pattern will be created, ready to be filled with instructions.

![decrement]({{site.baseurl}}/images/decrementpattern.png) **Decrement Pattern**
: Decrement the pattern index at the current sequence position, behaviour is
similar to the increment button with regards to existing or new patterns.

![duplicate]({{site.baseurl}}/images/duplicatesequence.png) **Duplicate Sequence**
: Create a new entry in the sequence, below the currently selected one, that
references the same pattern index as the current one. The pattern is exactly
the same, any changes made to the pattern when either sequence entry is current
will affect both, and any others that reference the same pattern.

![clone]({{site.baseurl}}/images/clonepattern.png) **Clone Pattern**
: Create a new sequence entry below the current one, create a copy of the
current pattern with a new index and reference that in the new sequence entry.
This is an entirely separate copy of the pattern, changes made to this new one
will not affect the original, and vice versa.
