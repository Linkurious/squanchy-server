/**
 * This module exports a function that creates a HTTP server that serves files
 */

(function () {
  let path = require('path');
  let https = require('https');
  let fs = require('fs');

  let express = require('express');
  let expressSession = require('express-session');

  let GitHubStrategy = require('passport-github').Strategy;
  let passport = require('passport');

  // sessions : use memory store
  const sessionOptions = {
    secret: Math.random().toString(36),
    resave: false,
    saveUninitialized: true,
    name: 'dev-center.session',
    rolling: true,
    store: require('./sessionStore'),
    cookie: { secure: false, httpOnly: false, path: '/', maxAge: null}
  };

  let serveIndex = require('serve-index');
  // let basicAuth = require('basic-auth');

  const credentials = require('./credentials');

  const TEMPLATE_PATH = path.join(__dirname, 'template.html'),
        STYLESHEET_PATH = path.join(__dirname, 'style.css');

  /**
   * Create a HTTP server
   * @param {object} app
   * @param {string} app.subdomain Subdomain which must be used for authentication
   * @param {number} app.port Port on which the server must be started
   * @param {boolean} app.directoryListing Whether to have directory listings
   * @param {string} rootDirectory Directory from which to serve the files
   * @param {object} githubConfig
   * @param {string} githubConfig.clientID
   * @param {string} githubConfig.clientSecret
   * @param {boolean} allowExternalPorts If true, the server will only serve files on localhost. Else the files can be accessed from all computers on the network.
   */
  function app(app, rootDirectory, githubConfig, allowExternalPorts) {
    passport.use(new GitHubStrategy({
          clientID: githubConfig.clientID,
          clientSecret: githubConfig.clientSecret,
          callbackURL: "http://doc.linkurio.us/callback" // TODO make it generic
        },
        function(accessToken, refreshToken, profile, cb) {
          return cb(null, profile);
        }
    ));

    var subdomain = app.domain;
    var port = app.port;

    let httpApp = express();

    function auth(req, res, next) {
      if (req.session.user || false) { // TODO if this path is not protected, next

      } else {
        return passport.authenticate('github')(req, res, (req, res, next) => {

        });
      }
    }

    httpApp.use(expressSession(sessionOptions));
    httpApp.use(auth);
    httpApp.use(express.static(rootDirectory, {dotfiles: 'allow'}));
    if (app.directoryListing) {
      httpApp.use('/', serveIndex(rootDirectory, {icons: true, template: TEMPLATE_PATH, stylesheet: STYLESHEET_PATH}));
    }

    httpApp.listen(port, allowExternalPorts ? undefined : 'localhost');

    console.log(`Serving files from ${rootDirectory} on port ${port}...`);
  }

  module.exports = app;
})();
