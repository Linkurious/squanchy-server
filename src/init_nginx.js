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

    // Add the user used by nginx if it doesn't exist
    var userExists = exec(`cat /etc/passwd | { grep "^${C.NGINX_USER}:" || true; }`);

    if (!userExists) {
      exec(`adduser --system --no-create-home ${C.NGINX_USER}`, `Adding user ${C.NGINX_USER}...`);
    }

    // Add the iptable rule to redirect port 80 to nginx port if doesn't exist
    var ruleExists = exec(`iptables -t nat -L PREROUTING --line-numbers | { grep "tcp dpt:http redir ports ${C.NGINX_PORT}" || true; }`);

    if (!ruleExists) {
      exec(`iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port ${C.NGINX_PORT}`, `Adding iptable rule to redirect port 80 on port ${C.NGINX_PORT}...`);
    }

    // Generate nginx configuration
    exec(() => fs.writeFileSync(C.NGINX_CONFIG_PATH, generateNginxConfig()), 'Generating nginx configuration...');

    // Start nginx if it's not already running
    var nginxRunning = exec('ps waux | grep "nginx: master process"').split('\n').filter(line => line.indexOf('grep') === -1).length;

    if (nginxRunning) {
      exec(`nginx -s stop`, 'Stopping nginx...');
    }

    exec(`nginx -c ${C.NGINX_CONFIG_PATH}`, 'Starting nginx...');

    process.on('SIGINT', function () {
      exec(`nginx -s stop`, '\nStopping nginx...');
      process.exit();
    });
  };
})();