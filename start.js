(function () {
  const path = require('path');
  const fs = require('fs');
  const startApp = require('./src/app');
  const initNginx = require('./src/init_nginx');
  const C = require('./src/config');

  function mkdir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }
  }

  initNginx();

  mkdir(C.ROOT);
  mkdir(C.SSL_DIR);
  mkdir(C.CREDENTIAL_DIR);

  C.APP_LIST.forEach(app => {
    var rootDir = path.join(C.ROOT, app.domain);

    mkdir(rootDir);
    startApp(app.domain, rootDir, app.port);
  });
})();