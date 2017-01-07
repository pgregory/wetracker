---
layout: post
title: Creating a Simple, Fast Pattern Editor in HTML 
date: 2016-11-23 09:18:00
categories: tracker, pattern, react
short_description: An experiment to prove the potential to create a some, light and fast pattern editor, akin to the ones found in FastTrackerII, MilkyTracker, etc. in pure HTML.
image_preview: images/patternthumb.png
---

Probably the second most important element of a good *Tracker*, second only to the music engine of course, is a streamlined and effective pattern editor. Many people are drawn to the Tracker approach by the interface's ability to afford rapid and effective data entry and editing. This is made possible in no small part by the simple and effective pattern editor interface. Tuned over many years on very low end hardware (although not necessarily considered low end at the time) such as the Amiga and DOS PC, this interface is an exercise in streamlined and unobtrusive user interaction.

As such, I decided that it was imperative when building a web based Tracker, that this part of the interface should be equally effective. Not only that, but in the realm of browser based applications, where you have little control over the host platform, it's important to eek as much out of the system as possible, and when playing complex audio through Javascript, you don't want the interface being computationally unweildy and taking away precious compute cycles from the audio engine.

After some initial experiments in pure React, I got very concerned that the performance of the pattern editor was going to be an issue, so I decided to run some separate exploration to see what could be achieved in isolation, to see if React or other UI elements in use at the time were hampering the potential to achive the low latency, low demand interface I needed.

I created a simple, single page, proof of concept that exercised the basic building blocks:

1. *Frozen* first column and header row.
2. Fast navigation.
3. Row based scrolling, rather than pixel based.
4. Cycled scrolling (when it reaches the bottom, it returns to the top).
5. Edit cursor.
6. Ideally, all in standard HTML with CSS styling.

This had to be able to render as fast as the browser could go in order to support playback at higher rates, such as 200+ beats per minute (bpm) with 16 or even 32 lines per beat (lpb).

The result was encouraging, click on the screenshot below to load the experiment and test it for yourself. Only basic interaction is included, mouse wheel to scroll, but you can see that even with frantic scrolling, the display keeps up, running smoothly at 60fps even on low end hardware.
<a href="{{site.github.url}}/experiments/pattern_editor/index.html"><img src="{{site.github.url}}/images/patterneditortest.png" style="width: 100%;"/></a>

Next up, I need to translate this into the React framework that is being developed. I'm still seeing significant slowdown, even using this same technique, so there's work to do, but at least the theory is proven.
