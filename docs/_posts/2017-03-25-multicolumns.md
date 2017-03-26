---
layout: post
title: Multiple Columns Per Track
date: 2017-03-25 08:45:00
categories: tracker 
short_description: Adding support for multiple note columns on each track, to 
  allow for chords and other effects without having to duplicate effect chains.
image_preview: images/multicolumn_thumb.png
---

Since adding the support for [effect chains]({{site.baseurl}}{% post_url
2017-03-02-dspeffects %}) to WeTracker, one weakness has concerned me. In order
to allow the playing of chords it is necessary to use multiple tracks, a common
practice in tracker composition when needing to play chords, or effectively
support polyphony. However, this is complicated by the use of effect chains, as
to fully support this, you'd need to duplicate the effect chain exactly on each
track.

Now WeTracker supports multiple columns per track. This effectively allows you
to play many notes, much the same as using multiple tracks for chords, while
having them feed through a single track, and therefore a single effect chain. 

<figure style="float: right; width: 300px;">
  <a href="{{site.baseurl}}/images/multicolumn.png">
    <img src="{{site.baseurl}}/images/multicolumn.png" style="width: 100%; height: 100%; object-fit: contain;"/>
  </a>
  <figcaption>Fig1. - Multiple Columns</figcaption>
</figure>

As you can see from the image in figure 1, Track 01 now has two columns, any
notes played on either of those two columns will be affected by any effects
chain applied to Track 01 equally. 

You will also notice a new per track control panel, currently containing just
add and remove column buttons, this will extend over time to include additional
functionality for controlling track specific actions.


Onwards and upwards...

[Renoise]: http://renoise.com/ "Renoise"
[TunaJS]: https://github.com/Theodeus/tuna "TunaJS"
[OpenMPT]: https://openmpt.org/ "OpenMPT"
