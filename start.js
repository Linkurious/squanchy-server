(function () {
  const path = require('path');
  const fs = require('fs');
  const startApp = require('./src/app');
  const C = require('./src/config');

  function mkdir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }
  }

  function generateNginxConfig() {
    var lines = [];
    lines.push(`user ${C.NGINX_USER} ${C.NGINX_USER}`);

    C.APP_LIST.forEach(app => {
      lines.push(
        ``,
        `server {`,
        `  listen *:${C.NGINX_PORT};`,
        `  port_in_redirect off;`,
        `  server_name ${app.domain}.${C.ROOT_DOMAIN};`,
        `  location / {`,
        `    proxy_pass localhost:${app.port};`,
        `  }`,
        `}`
      );
    });

    return lines.join('\n');
  }

  mkdir(C.ROOT);
  mkdir(C.SSL_DIR);
  mkdir(C.CREDENTIAL_DIR);

  C.APP_LIST.forEach(app => {
    var rootDir = path.join(C.ROOT, app.domain);

    mkdir(rootDir);
    startApp(app.domain, rootDir, app.port);
  });
})();