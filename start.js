(function () {
  const path = require('path');
  const fs = require('fs');
  const startApp = require('./src/app');
  const initNginx = require('./src/init_nginx');
  const C = require('./src/config');

  if (process.getuid() !== 0) {
    console.log('You must run this script as root.');
    process.exit(1);
  }

  function mkdir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }

    fs.chownSync(dirPath, C.UID, C.GID);
  }

  mkdir(C.ROOT);
  mkdir(C.SSL_DIR);
  mkdir(C.CREDENTIAL_DIR);

  initNginx();

  C.APP_LIST.forEach(app => {
    var rootDir = path.join(C.ROOT, app.domain);

    mkdir(rootDir);
    startApp(app.domain, rootDir, app.port);
  });
})();