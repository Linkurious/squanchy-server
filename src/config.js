/**
 * This file parse the configuration file and exports a formatted object that contain all
 * the data required by other files
 */

(function () {
  const path = require('path');
  const config = require('../config.json');
  const userid = require('userid');
  const _ = require('lodash');

  const OWNER = config.owner || 'root',
        ROOT = path.join(OWNER === 'root' ? '/root' : `/home/${OWNER}`, config.nginxRoot || 'www'),
        SSL_DIR = path.join(ROOT, config.sslDir || '.ssl'),
        PORT = config.nginxStartingPort || 8000;

  if (typeof config.parentDomain !== 'string') {
    throw new TypeError('Missing field "parentDomain" in configuration.');
  }
  if (typeof config.email !== 'string') {
    throw new TypeError('Missing field "email" in configuration.');
  }
  if (!(config.apps instanceof Array) || !config.apps.length) {
    throw new TypeError('Field "apps" in configuration should be a non-empty array of strings.');
  }
  if (config.apps.indexOf('all') !== -1 ) {
    throw new Error('"all" is a reserved sub-domain name');
  }

  let C = {
    ROOT: ROOT,
    NGINX_CONFIG_PATH: path.join(ROOT, '.nginx.conf'),
    NGINX_HTTP_PORT: PORT,
    NGINX_HTTPS_PORT: PORT + 1,
    NGINX_USER: config.nginxUser || 'nginx',
    ROOT_DOMAIN: config.parentDomain,
    SSL_ON: config.ssl,
    SSL_DIR: SSL_DIR,
    SSL_CERT_PATH: path.join(SSL_DIR, 'fullchain.pem'),
    SSL_KEY_PATH: path.join(SSL_DIR, 'privkey.pem'),
    EMAIL: config.email,
    UID: userid.uid(OWNER),
    GID: userid.gid(OWNER),
    APPS: _.map(config.apps, app => app.domain),
    APP_LIST: []
  };

  let apps = config.apps;

  for (let i = 0; i < apps.length; ++i) {
    C.APP_LIST.push({
      domain: apps[i].domain,
      name: apps[i].name,
      redirect: apps[i].redirect,
      port: PORT + 2 + i,
      fullDomain: `${apps[i].domain}.${C.ROOT_DOMAIN}`,
      directoryListing: apps[i].directoryListing,
      auth: apps[i].auth,
      ssl: config.ssl,
      symlinks: apps[i].symlinks,
      overrideLatest: apps[i].overrideLatest
    })
  }

  module.exports = C;
})();
