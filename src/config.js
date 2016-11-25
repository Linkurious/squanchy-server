(function () {
  const path = require('path');
  const config = require('../config.json');

  const ROOT = path.join(process.env['HOME'], config.nginx_root);

  var C = {
    ROOT: ROOT,
    NGINX_CONFIG_PATH: path.join(ROOT, '.nginx.conf'),
    NGINX_PORT: config.nginx_port,
    NGINX_USER: config.nginx_user,
    ROOT_DOMAIN: config.dns_suffix,
    SSL_DIR: path.join(ROOT, config.ssl_dir),
    CREDENTIAL_DIR: path.join(ROOT, config.credential_dir),
    APPS: config.apps || {},
    APP_LIST: []
  };

  for (var k in C.APPS) {
    C.APP_LIST.push({domain: k, port: C.APPS[k]});
  }

  module.exports = C;
})();