var path = require('path');
var https = require('https');
var crypto = require('crypto');
var fs = require('fs');

var express = require('express');
var serveIndex = require('serve-index');
var basicAuth = require('basic-auth');

const SHA256_SALT = 'sand-castle',
      TEMPLATE_PATH = path.join(__dirname, 'template.html'),
      STYLESHEET_PATH = path.join(__dirname, 'style.css'),
      CONFIG_PATH = path.join(__dirname, '..', 'config.json'),
      SSL_KEY_PATH = path.join(__dirname, '..', 'ssl', 'key.pem'),
      SSL_CERT_PATH = path.join(__dirname, '..', 'ssl', 'cert.pem');

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

function redirect(req, res) {
  var host = req.headers.host,
    index = host.indexOf(':'),
    httpsUrl = 'https://' + host.substr(0, index !== -1 ? index : host.length);

  if (index !== -1) {
    httpsUrl += ':' + config.https_port;
  }

  httpsUrl += req.url;

  res.redirect(httpsUrl);
}

function start(config, credentials) {
  var httpsApp = express(),
      httpApp = express(),
      server = https.createServer(credentials, httpsApp);

  function auth(req, res, next) {
    var user = basicAuth(req);

    if (!user || user.name !== config.user || hash(user.pass) !== config.password) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      return res.sendStatus(401);
    } else {
      return next();
    }
  }

  if (config.password !== '') {
    httpsApp.use('*', auth);
  }

  httpsApp.use(express.static(config.root));
  httpsApp.use('/', serveIndex(config.root, {icons: true, template: TEMPLATE_PATH, stylesheet: STYLESHEET_PATH}));

  httpApp.use('.well-known/*', express.static(config.root));
  httpApp.get('*', redirect);

  var count = 0;
  function ready() {
    if (++count === 2) {
      console.log(`Serving files from ${config.root} [HTTP: ${config.http_port}] [HTTPS: ${config.https_port}]`);
    }
  }

  httpApp.listen(config.http_port, ready);
  server.listen(config.https_port, ready);
}