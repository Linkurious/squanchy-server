/**
 * This module exports a function that creates a HTTP server that serves files
 */

'use strict';

const path = require('path');
const https = require('https');
const fs = require('fs');

const rp = require('fs.realpath');
const express = require('express');
const expressSession = require('express-session');
const serveIndex = require('serve-index');

const sessionStore = require('./sessionStore');
const GithubAuth = require('./githubAuth');
const GetLatest = require('./getLatest');
const AuthPage = require('./AuthPage');
const NotFoundPage = require('./NotFoundPage');

// sessions : use memory store
const sessionOptions = {
  secret: Math.random().toString(36),
  resave: false,
  saveUninitialized: true,
  name: 'squanchy.session',
  rolling: true,
  store: new sessionStore(),
  cookie: { secure: false, httpOnly: false, path: '/', maxAge: null}
};

const TEMPLATE_PATH = path.join(__dirname, 'template.html');
const STYLESHEET_PATH = path.join(__dirname, 'style.css');

/**
 * Create a HTTP server
 * @param {object} app
 * @param {string} app.domain Subdomain which must be used for authentication
 * @param {number} app.port Port on which the server must be started
 * @param {boolean} app.directoryListing Whether to have directory listings
 * @param {object} app.auth
 * @param {string} app.name
 * @param {string} rootDirectory Directory from which to serve the files
 * @param {boolean} allowExternalPorts If true, the server will only serve files on localhost. Else the files can be accessed from all computers on the network.
 */
function app(app, rootDirectory, allowExternalPorts) {
  const port = app.port;
  const httpApp = express();

  const getLatest = new GetLatest(rootDirectory);
  httpApp.use(getLatest.getMiddleware());

  httpApp.use('/resources', express.static(path.join(__dirname + '/resources'), {dotfiles: 'allow'}));

  if (app.auth) {
    const githubAuth = new GithubAuth(app.auth, app.domain);
    const authPage = new AuthPage(app);

    httpApp.use(expressSession(sessionOptions));

    httpApp.get('/auth', authPage.getMiddleware());

    httpApp.use('/callback', githubAuth.authMiddleware.bind(githubAuth));

    httpApp.use(function checkPathSafety(req, res, next) {
      // if realPath is different from rootDirectory + originalUrl we don't continue

      rp.realpath(rootDirectory + req.originalUrl.split('?')[0], function (err, realPath) {
        realPath = realPath && realPath.replace(/\/$/, '');
        let originalPath = (rootDirectory + req.originalUrl.split('?')[0]);
        originalPath = originalPath && originalPath.replace(/\/$/, '');
        if (realPath === originalPath) {
          next();
        } else {
          NotFoundPage(req, res); // A symlink exist, but we don't serve symlinks
        }
      });
    });
    httpApp.use(app.auth.urlPrefix, githubAuth.authMiddleware.bind(githubAuth));
  }

  httpApp.use(express.static(rootDirectory, {dotfiles: 'deny'}));
  if (app.directoryListing) {
    httpApp.use('/', serveIndex(rootDirectory, {icons: true, template: TEMPLATE_PATH, stylesheet: STYLESHEET_PATH}));
  } else {
    httpApp.use('/', (req, res, next) => {
      if (req.headers['accept'] === 'application/json') {
        return serveIndex(rootDirectory,
            {icons: true, template: TEMPLATE_PATH, stylesheet: STYLESHEET_PATH})(req, res, next);
      } else {
        NotFoundPage(req, res); // Actual not found content
      }
    });
  }

  httpApp.listen(port, allowExternalPorts ? undefined : 'localhost');

  console.log(`Serving files from ${rootDirectory} on port ${port}...`);
}

module.exports = app;

