(function () {
  const path = require('path');
  const config = require('../config.json');
  const userid = require('userid');

  const OWNER = config.owner || 'root',
        ROOT = path.join(OWNER === 'root' ? '/root' : `/home/${OWNER}`, config.nginx_root || 'www'),
        SSL_DIR = path.join(ROOT, config.ssl_dir || '.ssl'),
        PORT = config.nginx_starting_port || 8000;

  var C = {
    ROOT: ROOT,
    NGINX_CONFIG_PATH: path.join(ROOT, '.nginx.conf'),
    NGINX_HTTP_PORT: PORT,
    NGINX_HTTPS_PORT: PORT + 1,
    NGINX_USER: config.nginx_user || 'nginx',
    ROOT_DOMAIN: config.dns_suffix,
    SSL_DIR: SSL_DIR,
    SSL_CERT_PATH: path.join(SSL_DIR, 'cert.crt'),
    SSL_KEY_PATH: path.join(SSL_DIR, 'cert.key'),
    UID: userid.uid(OWNER),
    GID: userid.gid(OWNER),
    CREDENTIAL_DIR: path.join(ROOT, config.credential_dir || '.credentials'),
    APP_LIST: []
  };

  var apps = config.apps || [];

  for (var i = 0; i < apps.length; ++i) {
    C.APP_LIST.push({domain: apps[i], port: PORT + 2 + i})
  }

  module.exports = C;
})();