(function () {
  const fs = require('fs');
  const express = require('express');
  const exec = require('./utility').exec;
  const C = require('./config');

  function startWebRootServer(dir) {
    var httpApp = express();
    httpApp.use(express.static(dir, {dotfiles: 'allow'}));
    httpApp.listen(80);

    return httpApp;
  }

  module.exports = function () {
    if (!fs.existsSync(C.SSL_CERT_PATH) || !fs.existsSync(C.SSL_KEY_PATH)) {
      console.log('No certificate found, generating one using certbot...');

      var webroot = startWebRootServer(C.SSL_DIR);

      var cmd = `certbot certonly --webroot -w ${C.SSL_DIR}`;
      C.APP_LIST.forEach(app => cmd += ` -d ${app.fullDomain}`);
      exec(cmd);

      webroot.stop();

      exec(`cp /etc/letsencrypt/live/${C.APP_LIST[0]}/cert.pem ${C.SSL_CERT_PATH}`);
      exec(`cp /etc/letsencrypt/live/${C.APP_LIST[0]}/privkey.pem ${C.SSL_KEY_PATH}`);
    }
  }
})();