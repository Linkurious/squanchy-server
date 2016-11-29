var path = require('path');
var https = require('https');
var fs = require('fs');

var express = require('express');
var serveIndex = require('serve-index');
var basicAuth = require('basic-auth');

const credentials = require('./credentials');

const TEMPLATE_PATH = path.join(__dirname, 'template.html'),
      STYLESHEET_PATH = path.join(__dirname, 'style.css');

function app(subdomain, rootDirectory, port, allowExternalPorts) {
  var httpApp = express();

  function auth(req, res, next) {
    var user = basicAuth(req);

    if (!user || !credentials.check(subdomain, user.name, user.pass)) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      return res.sendStatus(401);
    } else {
      return next();
    }
  }

  httpApp.use('*', auth);
  httpApp.use(express.static(rootDirectory, {dotfiles: 'allow'}));
  httpApp.use('/', serveIndex(rootDirectory, {icons: true, template: TEMPLATE_PATH, stylesheet: STYLESHEET_PATH}));

  httpApp.listen(port, allowExternalPorts ? undefined : 'localhost');

  console.log(`Serving files from ${rootDirectory} on port ${port}...`);
}

module.exports = app;