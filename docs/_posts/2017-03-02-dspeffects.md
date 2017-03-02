---
layout: post
title: Track Effect Chains 
date: 2017-03-02 13:28:00
categories: tracker 
short_description: Implementing per track effects chains.
image_preview: images/dspeffects_thumb.png
---

One of the advanced features that I had always planned to implement in
WeTracker that isn't typically found in older tracker software, is the ability
to apply effects to tracks, and ultimately instruments and the master output as
well.

Some modern trackers such as [Renoise], and [OpenMPT] do support this sort of
effect capability, and it is very common in non-tracker style DAWs. Webaudio
makes this entirely possible thanks to the node-based nature of the API. It is
possible to chain together various node types, including filters and even
Javascript processing nodes. 

Thanks to an open source library, [TunaJS], that provides a set of ready made
Webaudio effects nodes that can easily be slotted into an existing node tree,
the audio part was fairly straightforward. Creating an effective interface took
a little longer, but it's basically there. Currently it's only possible to
apply effects chains to individual tracks, there is no limit on the number of
effects in the chain, and it's possible to reorder and delete the effects
through the interface. 

Currently the majority of the [TunaJS] effects are available to try out, just
double click on the effect name in the list to add it to the end of the chain
for the currently selected track. Work is underway to introduce the concept of
a master track that can have effects applied to it.

See the following video for a quick intro to the functionality.

<iframe width="560" height="315"
src="https://www.youtube.com/embed/WJSnw2aoKgM" frameborder="0"
allowfullscreen></iframe>

Onwards and upwards...

[Renoise]: http://renoise.com/ "Renoise"
[TunaJS]: https://github.com/Theodeus/tuna "TunaJS"
[OpenMPT]: https://openmpt.org/ "OpenMPT"
