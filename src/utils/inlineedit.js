import $ from 'jquery';
import { virtualKeyboard } from './virtualkeyboard';

$.fn.inlineEdit = function(options = {}) {
  let settings = $.extend({
    editor: '<input class="inline-editor" name="temp" type="text" />',
  }, options);

  let cancel = false;

  $(this).hover(function() {
    $(this).addClass('hover');
  }, function() {
    $(this).removeClass('hover');
  });

  $(this).dblclick(function() {
    virtualKeyboard.pause();
    const elem = $(this);
    cancel = false;

    let replaceWith = $(settings.editor);
    const width = elem.width();

    elem.hide();
    elem.after(replaceWith);
    replaceWith.width(width);
    replaceWith.val(elem.text());
    replaceWith.focus();

    replaceWith.blur(function() {
      if ($(this).val() != "" && !cancel) {
        if (typeof settings.accept === 'function') { 
          settings.accept.call(this, $(this).val());
        }
        elem.text($(this).val());
      }

      $(this).remove();
      elem.show();
      virtualKeyboard.resume();
    });

    replaceWith.keyup(function(e) {
      if(e.key === "Enter" || e.key === "Escape") {
        if(e.key === "Escape") {
          cancel = true;
        } else {
          cancel = false;
        }
        $(this).blur();
      }
    });
  });
};
