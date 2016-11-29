(function () {
  const fs = require('fs');
  const express = require('express');
  const exec = require('./utility').exec;
  const C = require('./config');

  function startWebRootServer(dir) {
    var httpApp = express();
    httpApp.use(express.static(dir, {dotfiles: 'allow'}));
    httpApp.listen(C.NGINX_HTTP_PORT);

    return httpApp;
  }

  if (!fs.existsSync(C.SSL_CERT_PATH) || !fs.existsSync(C.SSL_KEY_PATH)) {
    var webroot = startWebRootServer(C.SSL_DIR);
  }
})();