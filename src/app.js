var path = require('path');
var https = require('https');

var express = require('express');
var serveIndex = require('serve-index');

const FILES_ROOT_PATH = path.join(__dirname, '..', 'files'),
      CONFIG_PATH = path.join(__dirname, '..', 'config.json'),
      SSL_KEY_PATH = path.join(__dirname, '..', 'ssl', 'key'),
      SSL_CERT_PATH = path.join(__dirname, '..', 'ssl', 'cert');

require('./config.js').load(CONFIG_PATH, function (config) {
  require('./ssl.js').load(SSL_KEY_PATH, SSL_CERT_PATH, function (credentials) {
    start(config, credentials);
  });
});

function start(config, credentials) {
  var httpsApp = express(),
      httpApp = express(),
      server = https.createServer(credentials, httpsApp);

  httpsApp.use(express.static(FILES_ROOT_PATH));
  httpsApp.use('/', serveIndex(FILES_ROOT_PATH, {icons: true, hidden: true}));

  httpApp.get('*', function (req, res) {
    var host = req.headers.host,
        index = host.indexOf(':'),
        httpsUrl = 'https://' + host.substr(0, index !== -1 ? index : host.length);

    if (config.https_port !== 443) {
      httpsUrl += ':' + config.https_port;
    }

    httpsUrl += req.url;

    res.redirect(httpsUrl);
  });

  httpApp.listen(config.http_port, function () {
    console.log(`HTTP server running on port ${config.http_port}...`);
  });

  server.listen(config.https_port, function () {
    console.log(`HTTPS server running on port ${config.https_port}...`);
  });
}