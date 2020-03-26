/**
 * This module exports a function that creates a HTTP server that serves files
 */

'use strict';

const path = require('path');
const https = require('https');
const fs = require('fs');

const rp = require('fs.realpath');
const compression = require('compression');
const compressible = require('compressible');
const express = require('express');
const expressSession = require('express-session');
const serveIndex = require('serve-index');
const basicAuth = require('express-basic-auth');

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
 * @param {object} app.symlinks
 * @param {string} rootDirectory Directory from which to serve the files
 * @param {object} overrideLatest Versions to set as latest indexed by project name
 * @param {boolean} allowExternalPorts If true, the server will only serve files on localhost. Else the files can be accessed from all computers on the network.
 */
function app(app, rootDirectory, allowExternalPorts, overrideLatest) {
  const port = app.port;
  const httpApp = express();

  httpApp.use(compression({
    filter: (req, res) => {
      const type = res.getHeader('Content-Type');

      const isCompressible = (
        type !== undefined
        // Gephi files gexf can be compressed.
        // It is usually disabled as video are already compressed and there's no benefit
        && (
          type === 'application/octet-stream'
          ||
          compressible(type)
        )
      );
      return isCompressible;
    }
  }));

  if (app.redirect) {
    httpApp.use((req, res, next) => {
      res.redirect(app.redirect + req.originalUrl);
    });
  }

  const getLatest = new GetLatest(rootDirectory);
  httpApp.use(getLatest.getMiddleware(overrideLatest));

  if (app.symlinks) {
    httpApp.use((req, res, next) => {
      for (var path in app.symlinks) {
        if (app.symlinks.hasOwnProperty(path)) {
          if (req.originalUrl.indexOf(path) === 0) {
            return res.redirect(app.symlinks[path]);
          }
        }
      }
      next();
    });
  }

  httpApp.use('/resources', express.static(path.join(__dirname + '/resources'), {dotfiles: 'allow'}));

  if (app.auth) {
    if (app.auth.type === 'basic') {
      // HTTP basic auth

      if (!app.auth.urlPrefix) {
        app.auth.urlPrefix = '/';
      }
      httpApp.use(app.auth.urlPrefix, basicAuth({
        users: app.auth.users,
        challenge: true,
        realm: 'Auth for "' + app.name + '"'
      }));

    } else {
      // GITHUB auth

      const githubAuth = new GithubAuth(app.auth, app.domain);
      const authPage = new AuthPage(app);

      httpApp.use(expressSession(sessionOptions));

      httpApp.get('/auth', authPage.getMiddleware());

      httpApp.use('/callback', githubAuth.authMiddleware.bind(githubAuth));

      httpApp.use(function checkPathSafety(req, res, next) {
        // if realPath is different from rootDirectory + url we don't continue

        let pathToCheck = decodeURIComponent(rootDirectory + req.url.split('?')[0]);

        rp.realpath(pathToCheck, function(err, realPath) {
          realPath = realPath && realPath.replace(/\/$/, '');
          pathToCheck = pathToCheck && pathToCheck.replace(/\/$/, '');
          if (realPath === pathToCheck) {
            next();
          } else {
            NotFoundPage(req, res); // A symlink exist, but we don't serve symlinks
          }
        });
      });
      httpApp.use(app.auth.urlPrefix, githubAuth.authMiddleware.bind(githubAuth));
    }
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

