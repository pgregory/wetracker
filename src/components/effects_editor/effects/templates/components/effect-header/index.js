const template = require('./template.marko');

module.exports = function effectHeader(input, out) {
  template.render({
    name: input.name || '(no name)',
  }, out);
};
