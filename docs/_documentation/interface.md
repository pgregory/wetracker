---
title: interface
layout: documentation
index: 20
indent: 1
---

wetracker interface
===================

wetracker is a single page application, organsed as a series of tab views, each
containing a number of 'widgets' organised in a grid in the view. Each widget
in the the interface is independently placed within a grid layout. You can
reorganise the widgets in any way that suits your working preferences. Each
widget has a border, in each corner you'll see a small arrow icon. Select and
drag on any of these to resize the widget. 
<a title="Drag widget" href="{{site.baseurl}}/images/dragwidget.png"><img
style="float: right;" src="{{site.baseurl}}/images/dragwidget.png"
width="200px"/></a>
The neigbouring widgets will move to compensate for the change. Widgets cannot
go beyond the bounds of the screen horizontally, but the space will grow
vertically to accept the new layout.  Grabbing the header bar of the widget
will allow you to move it freely within the grid. Again, other widgets will
automatically move to accommodate the new layout. While dragging, the final
location of the widget will be displayed as a dotted line, allowing you to see
the effect of your change before dropping it.

**Note:** The widget layout is not stored between sessions
at this time, any changes made will be lost the next time you refresh the
application.  
{: .t-hackcss-note }

**Note:** It is not possible to add or remove widgets from a
layout at this time.
{: .t-hackcss-note }

Widgets typically include some common features, already mentioned is the border
with resizing controls. Many widgets will also include a toolbar, which can be
attached to any of the sides of the widget body. More complex widgets will
include control panels, again attached to one of the widget sides, which will
contain controls specific to the element the widget is responsible for.

See the subsequence sections for details of each widget type, it's elements and
function.

<a title="Tabs" href="{{site.baseurl}}/images/interface_tabs.png">
  <img src="{{site.baseurl}}/images/interface_tabs.png" style="width: 100%; height: 100%; object-fit: contain;"/>
</a>

The main screen is split into three sections, the
*Transport*{:style="color:#E5D964"}, the *Tabs*{:style="color:#E20000"}, and
the main *Tab Pages*{:style="color:#87AE9A"} area.

The transport contains controls that are generally common enough to be
applicable at any point in the process of creating music. This sticks to the
top of the browser window, making the controls always visible and accessible.
See [Transport](/documentation/interface/transport) for details of the controls
available.

The tabs section lists the pages that are currently configured. Each page
contains it's own set of widgets, in it's own layout, often specific to a
particular aspect of song creation. By default, WeTracker presents a song
editing and instrument editing page, the default layout is described in the
documentation as a guide, however, this page setup and layout may change if
you've customised the view.

**Note:** Currently it is not possible to add or delete tabs, or store changes
to the page layouts.
{: .t-hackcss-note }

[modeline]: # ( vim: set textwidth=79: )
