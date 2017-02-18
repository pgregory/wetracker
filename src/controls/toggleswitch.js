import $ from 'jquery';

(function () {

  //options

  function ToggleSwitch(element) {
    this.$checkbox = $(element);
    this.render();
    this.init();
  }

  ToggleSwitch.prototype.render = function () {
    this.$checkbox.hide();
    this.$el = $('<div class="toggle-switch ui-corner-all ui-widget"/>')
      .insertAfter(this.$checkbox);
    this.$handle = $('<div class="toggle-handle"/>')
      .appendTo(this.$el);
    this.init();
  };

  ToggleSwitch.prototype.init = function () {
    var self = this;
    this._val = this.$checkbox.is(":checked");
    this.$el.removeClass("on off")
      .addClass(this._val ? "on" : "off");
    this.$handle
      .draggable({
      containment: this.$el,
      stop: function (event, ui) {
        var newVal = ui.position.left > self.threshold;
        if (newVal !== self._val) {
          self.toggle();
        } else {
          self.position(self._val);
        }
      }
    });
    this.$el.off("click")
      .on("click", function () {
      self.toggle();
    });
    this.threshold = this.$el.outerWidth() / 2 - this.$handle.outerWidth() / 2;
    this.position(this._val, true);
  };

  ToggleSwitch.prototype.val = function (val) {
    if ((val || val === false) && val !== this._val) {
      this.toggle();
    }
    return this._val;
  };

  ToggleSwitch.prototype.position = function (val, immediate) {
    var self = this;
    var opts = {
      my: val ? "right center" : "left center",
      at: val ? "right center" : "left center",
      of: this.$el,
      using: immediate ? null : function (css) {
        self.$handle.animate(css, 50, "linear");
      }
    };
    this.$handle.position(opts);
  };

  ToggleSwitch.prototype.toggle = function () {
    this._val = !this._val;
    this.$el.toggleClass("on off");
    this.$el.trigger("change", [this._val]);
    this.$checkbox.trigger("click");
    this.position(this._val);
  };

  ToggleSwitch.prototype.destroy = function () {
    this.$checkbox.insertAfter(this.$el);
    this.$el.remove();
  };

  $.fn['toggleSwitch'] = function (options) {
    if ($.isFunction(ToggleSwitch.prototype[options])) {
      var plugin = $(this).data("toggleSwitch");
      return plugin[options].apply(plugin, Array.prototype.slice(1, arguments));
    }
    return this.each(function () {
      var plugin = $.data(this, 'toggleSwitch');
      if (!plugin) {
        $.data(this, 'toggleSwitch', new ToggleSwitch(this, options));
      }
    });

  };

  return ToggleSwitch;
})();

