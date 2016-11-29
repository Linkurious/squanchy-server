(function () {
  const fs = require('fs');
  const http = require('http');
  const express = require('express');
  const exec = require('./utility').exec;
  const execAsync = require('child_process').exec;
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
      `http {`,
      `  server {`,
      `    listen ${C.NGINX_HTTP_PORT} default_server;`,
      `    server_name _;`,
      `    return 301 https://$host$request_uri;`,
      `  }`
    );

    // server {
    //   listen 80;
    //   return 301 https://$host$request_uri;
    //     }

    C.APP_LIST.forEach(app => {
      lines.push(
        ``,
        `  server {`,
        `    listen ${C.NGINX_HTTPS_PORT};`,
        `    server_name ${app.domain}.${C.ROOT_DOMAIN};`,
        `    port_in_redirect off;`,
        `    ssl on;`,
        `    ssl_certificate ${C.SSL_CERT_PATH};`,
        `    ssl_certificate_key ${C.SSL_KEY_PATH};`,
        `    location / {`,
        `      proxy_pass http://localhost:${app.port};`,
        `      proxy_ssl_session_reuse on;`,
        `      proxy_redirect off;`,
        `      proxy_set_header   Host             $host;`,
        `      proxy_set_header   X-Real-IP        $remote_addr;`,
        `      proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;`,
        `    }`,
        `  }`
      );
    });

    lines.push(`}`);

    return lines.join('\n');
  }

  function startWebRootServer(dir, port) {
    var app = express();

    app.use(express.static(dir, {dotfiles: 'allow'}));
    return app.listen(port);
  }

  function startNginx() {
    // Start nginx if it's not already running
    var nginxRunning = exec('ps waux | grep "nginx: master process"').split('\n').filter(line => line.indexOf('grep') === -1).length;

    if (nginxRunning) {
      exec(`nginx -s stop`, 'Nginx is already running, stopping it...');
    }

    exec(`nginx -c ${C.NGINX_CONFIG_PATH}`, 'Starting Nginx...');

    process.on('SIGINT', function () {
      exec(`nginx -s stop`, '\nStopping Nginx...');
      process.exit();
    });
  }

  module.exports = function (callback) {

    // Add the user used by nginx if it doesn't exist
    var userExists = exec(`cat /etc/passwd | { grep "^${C.NGINX_USER}:" || true; }`);

    if (!userExists) {
      exec(`adduser --system --no-create-home ${C.NGINX_USER}`, `Adding user ${C.NGINX_USER}...`);
    }

    // Add the iptable rule to redirect port 80 to nginx port if doesn't exist
    var ruleExists = exec(`iptables -t nat -L PREROUTING --line-numbers | { grep "tcp dpt:http redir ports ${C.NGINX_HTTP_PORT}" || true; }`);

    if (!ruleExists) {
      exec(`iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port ${C.NGINX_HTTP_PORT}`, `Adding iptable rule to redirect port 80 on port ${C.NGINX_HTTP_PORT}...`);
      exec(`iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port ${C.NGINX_HTTPS_PORT}`, `Adding iptable rule to redirect port 443 on port ${C.NGINX_HTTPS_PORT}...`);
      exec(`iptables -t nat -I OUTPUT -p tcp -o lo --dport 80 -j REDIRECT --to-port ${C.NGINX_HTTP_PORT}`, `Adding iptable rule to redirect port 80 on port ${C.NGINX_HTTP_PORT} (loopback)...`);
      exec(`iptables -t nat -I OUTPUT -p tcp -o lo --dport 443 -j REDIRECT --to-port ${C.NGINX_HTTPS_PORT}`, `Adding iptable rule to redirect port 443 on port ${C.NGINX_HTTPS_PORT} (loopback)...`);
    }

    // Generate nginx configuration
    exec(() => { fs.writeFileSync(C.NGINX_CONFIG_PATH, generateNginxConfig()); fs.chownSync(C.NGINX_CONFIG_PATH, C.UID, C.GID); }, 'Generating Nginx configuration...');

    // Generate SSL certificate if it does not exist
    if (!fs.existsSync(C.SSL_CERT_PATH) || !fs.existsSync(C.SSL_KEY_PATH)) {
      console.log('No certificate found, generating one using certbot...');

      var webroot = startWebRootServer(C.SSL_DIR, C.NGINX_HTTP_PORT);

      var cmd = `certbot certonly -n --agree-tos --email ${C.EMAIL} --webroot -w ${C.SSL_DIR}`;
      C.APP_LIST.forEach(app => cmd += ` -d ${app.fullDomain}`);

      execAsync(cmd, (err, stdout, stderr) => {
        if (err) {
          console.log(stderr);
          console.log(`${err}`);
          process.exit(1);
        }

        console.log(stdout);

        webroot.close();
        exec(`ln -s /etc/letsencrypt/live/${C.APP_LIST[0].fullDomain}/cert.pem ${C.SSL_CERT_PATH}`);
        exec(`ln -s /etc/letsencrypt/live/${C.APP_LIST[0].fullDomain}/privkey.pem ${C.SSL_KEY_PATH}`);

        startNginx();
        callback();
      });

    } else {
      startNginx();
      callback();
    }
  };
})();