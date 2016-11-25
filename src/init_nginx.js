(function () {
  const fs = require('fs');
  const exec = require('./utility').exec;
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

  module.exports = function () {
    if (!fs.existsSync(C.NGINX_CONFIG_PATH)) {
      exec(() => fs.writeFileSync(C.NGINX_CONFIG_PATH, generateNginxConfig()), 'nginx configuration file not found, generating it...');
    }

    var ruleExists = exec(`iptables -t nat -L PREROUTING --line-numbers | { grep "tcp dpt:http redir ports ${C.NGINX_PORT}" || true; }`);

    if (!ruleExists) {
      exec(`iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port ${C.NGINX_PORT}`, `Adding iptable rule to redirect port 80 on port ${C.NGINX_PORT}...`);
    }

    var nginxRunning = exec('ps waux | grep "nginx: master process"').split('\n').filter(line => line.indexOf('grep') === -1).length;

    if (nginxRunning) {
      console.log('nginx is already running.');
    } else {
      exec(`nginx -c ${C.NGINX_CONFIG_PATH}`, 'Starting nginx...');
    }
  };
})();