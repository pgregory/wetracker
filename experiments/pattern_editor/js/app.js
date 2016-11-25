requirejs.config({
  baseUrl: 'bower_components/',
  paths: {
    app: '../js/app',
    lib: '../js/lib',
  }
});

requirejs(['jquery/dist/jquery', 'app/pattern_editor'],
          function($, pattern_editor) {
            console.log("loaded");
            pattern_editor.render();
          });
