var express = require('express');
var path = require('path');
var serveStatic = require('serve-static')
app = express();
app.use(serveStatic(__dirname));
var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 5000;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
app.listen(port, server_ip_address, function () {
  console.log( "Listening on " + server_ip_address + ", port " + port )
});
