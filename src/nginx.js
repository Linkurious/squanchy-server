(function () {
  const fs = require('fs');
  const C = require('./config');

  function generateNginxConfig() {
    var lines = [];
    lines.push(
      `user ${C.NGINX_USER} nogroup;`,
      `worker_processes 2;`,
      ``,
      `events {`,
      `  worker_connections 1024;`,
      `}`,
      ``,
      `http {`
    );

    C.APP_LIST.forEach(app => {
      lines.push(
        ``,
        `  server {`,
        `    listen *:${C.NGINX_PORT};`,
        `    port_in_redirect off;`,
        `    server_name ${app.domain}.${C.ROOT_DOMAIN};`,
        `    location / {`,
        `      proxy_pass http://localhost:${app.port};`,
        `    }`,
        `  }`
      );
    });

    lines.push(`}`);

    return lines.join('\n');
  }

  fs.writeFileSync(C.NGINX_CONFIG_PATH, generateNginxConfig());
})();