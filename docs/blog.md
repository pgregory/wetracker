---
layout: default
permalink: blog
---

Posts
=====


{% for post in site.posts %}
  {% assign nth = forloop.index0 | modulo:2 %}
  <div class="media">

    {% if nth == 0 %}
    <div class="media-left">
      <div class="avatarholder">
        <img class="t-hackcss-media-image"
             src="{{ post.image_preview }}" alt="{{ post.title }}"
             title="{{ post.title }}" />
      </div>
    </div>
    {% endif %}

    <div class="media-body">
      <div class="media-heading">
        <span>{{ post.date | date_to_string }} &raquo;
          {% if post.external_url %}
            <a href="{{ post.external_url }}" target="_blank" title="{{ post.name }}">
              {{ post.title }}
            </a>
          {% else %}
            <a href="{{ post.url | prepend: site.baseurl }}" title="{{ post.name }}">
              {{ post.title }}
            </a>
          {% endif %}
        </span>
      </div>
      <div class="media-content">
        {{ post.short_description }}
      </div>
    </div>

    {% if nth == 1 %}
    <div class="media-right">
      <div class="avatarholder">
        <img class="t-hackcss-media-image"
             src="{{ post.image_preview }}" alt="{{ post.title }}"
             title="{{ post.title }}" />
      </div>
    </div>
    {% endif %}
  </div>
{% endfor %}
