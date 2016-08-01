var path = require('path');
var https = require('https');
var crypto = require('crypto');

var express = require('express');
var serveIndex = require('serve-index');
var basicAuth = require('basic-auth');

const SHA256_SALT = 'sand-castle',
      CONFIG_PATH = path.join(__dirname, '..', 'config.json'),
      SSL_KEY_PATH = path.join(__dirname, '..', 'ssl', 'key'),
      SSL_CERT_PATH = path.join(__dirname, '..', 'ssl', 'cert');

require('./config.js').load(CONFIG_PATH, function (config) {
  require('./ssl.js').load(SSL_KEY_PATH, SSL_CERT_PATH, function (credentials) {
    start(config, credentials);
  });
});

function hash(password) {
  var sum = crypto.createHash('sha256');
  sum.update(password + SHA256_SALT);
  return sum.digest('hex');
}

function start(config, credentials) {
  var httpsApp = express(),
      httpApp = express(),
      server = https.createServer(credentials, httpsApp);

  httpsApp.use('*', function (req, res, next) {
    var user = basicAuth(req);

    if (!user || user.name !== config.user || hash(user.pass) !== config.password) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      return res.sendStatus(401);
    } else {
      return next();
    }
  });
  httpsApp.use(express.static(config.root));
  httpsApp.use('/', serveIndex(config.root, {icons: true, hidden: true}));

  httpApp.get('*', function (req, res) {
    var host = req.headers.host,
        index = host.indexOf(':'),
        httpsUrl = 'https://' + host.substr(0, index !== -1 ? index : host.length);

    if (index !== -1) {
      httpsUrl += ':' + config.https_port;
    }

    httpsUrl += req.url;

    res.redirect(httpsUrl);
  });

  var count = 0;
  function ready() {
    if (++count === 2) {
      console.log(`Serving files from ${config.root} [HTTP: ${config.http_port}] [HTTPS: ${config.https_port}]`);
    }
  }

  httpApp.listen(config.http_port, ready);
  server.listen(config.https_port, ready);
}