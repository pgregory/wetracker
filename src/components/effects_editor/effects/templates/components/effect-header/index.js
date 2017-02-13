var template = require('./template.marko');

module.exports = function(input, out) {
    template.render({
        name: input.name || '(no name)'
    }, out);
};
