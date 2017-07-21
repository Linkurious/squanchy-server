'use strict';

(function () {
  const path = require('path');
  const fs = require('fs');
  const startApp = require('./src/app');
  const initNginx = require('./src/init_nginx');
  const C = require('./src/config');

  // Check that the script is run as root, otherwise nginx won't start
  if (process.getuid() !== 0) {
    console.log('You must run this script as root.');
    process.exit(1);
  }

  // Create directories for the nginx user
  function ensureDirSync(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }

    fs.chownSync(dirPath, C.UID, C.GID);
  }

  ensureDirSync(C.ROOT);
  ensureDirSync(C.SSL_DIR);

  // After starting nginx, start an HTTP server for each sub-domain
  initNginx(C.SSL_ON, () => {
    C.APP_LIST.forEach(app => {
      let rootDir = path.join(C.ROOT, app.domain);

      ensureDirSync(rootDir);
      startApp(app, rootDir, false, app.overrideLatest);
    });
  });
})();
