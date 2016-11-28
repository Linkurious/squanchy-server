(function () {
  const path = require('path');
  const config = require('../config.json');
  const userid = require('userid');

  const ROOT = path.join(process.env['HOME'], config.nginx_root);

  var C = {
    ROOT: ROOT || 'www',
    NGINX_CONFIG_PATH: path.join(ROOT, '.nginx.conf'),
    NGINX_PORT: config.nginx_port || 8000,
    NGINX_USER: config.nginx_user || 'nginx',
    ROOT_DOMAIN: config.dns_suffix,
    SSL_DIR: path.join(ROOT, config.ssl_dir || '.ssl'),
    UID: userid.uid(config.owner || 'root'),
    GID: userid.gid(config.owner || 'root'),
    CREDENTIAL_DIR: path.join(ROOT, config.credential_dir || '.credentials'),
    APPS: config.apps || {},
    APP_LIST: []
  };

  for (var k in C.APPS) {
    C.APP_LIST.push({domain: k, port: C.APPS[k]});
  }

  module.exports = C;
})();