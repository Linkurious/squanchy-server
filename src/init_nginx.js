/**
 * Create the nginx configuration based on the JSON configuration, create the IPTABLE rules to create the
 * redirection from ports 80/443 to the internal ports, and start nginx.
 */

(function () {
  const fs = require('fs');
  const http = require('http');
  const express = require('express');
  const exec = require('./utility').exec;
  const execAsync = require('child_process').exec;

  // Load the formatted configuration
  const C = require('./config');

  function generateNginxConfig(sslOn) {
    // nginx configuration initialization
    let lines = [];

    // This will always be the same
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

    if (sslOn) {
      // When connecting on HTTP, redirect to HTTPS
      lines.push(
          `  server {`,
          `    listen ${C.NGINX_HTTP_PORT} default_server;`,
          `    server_name _;`,
          `    return 301 https://$host$request_uri;`,
          `  }`
      );
    }

    // For each sub-domain we want, create a nginx rule that will redirect request to this sub-domain to
    // the appropriate internal port
    C.APP_LIST.forEach(app => {
      lines.push(
        ``,
        `  server {`,
        `    listen ${sslOn ? C.NGINX_HTTPS_PORT : C.NGINX_HTTP_PORT};`,
        `    server_name ${app.domain}.${C.ROOT_DOMAIN};`,
        `    port_in_redirect off;`,
        `    ssl ${sslOn ? 'on' : 'off'};`,
        sslOn ? `    ssl_certificate ${C.SSL_CERT_PATH};` : '',
        sslOn ? `    ssl_certificate_key ${C.SSL_KEY_PATH};`: '',
        `    location / {`,
        `      proxy_pass http://localhost:${app.port};`,
        sslOn ? `      proxy_ssl_session_reuse on;` : '',
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

  /**
   * Start a web-root server. This is used to generate the SSL certificate with Let's Encrypt.
   * More information here: https://certbot.eff.org/docs/using.html
   *
   * @param dir
   * @param port
   * @returns {*}
   */
  function startWebRootServer(dir, port) {
    let app = express();

    app.use(express.static(dir, {dotfiles: 'allow'}));
    return app.listen(port);
  }

  /**
   * Starts the nginx server.
   * If one is already running, stops the current one.
   */
  function startNginx() {
    // Check if nginx is already running
    let nginxRunning = exec('ps waux | grep "nginx: master process"').split('\n').filter(line => line.indexOf('grep') === -1).length;

    if (nginxRunning) {
      exec(`nginx -s stop`, 'Nginx is already running, stopping it...');
    }

    exec(`nginx -c ${C.NGINX_CONFIG_PATH}`, 'Starting Nginx...');

    // When the process is stopped (the user pressed CTRL-C), we want to close nginx before the application exits
    process.on('SIGINT', function () {
      exec(`nginx -s stop`, '\nStopping Nginx...');
      process.exit();
    });
  }

  module.exports = function (sslOn, callback) {

    // Add the user used by nginx if it doesn't exist
    let userExists = exec(`cat /etc/passwd | { grep "^${C.NGINX_USER}:" || true; }`);

    if (!userExists) {
      exec(`adduser --system --no-create-home ${C.NGINX_USER}`, `Adding user ${C.NGINX_USER}...`);
    }

    // Add the iptable rule to redirect port 80 to nginx port if doesn't exist
    let ruleExists = exec(`iptables -t nat -L PREROUTING --line-numbers | { grep "tcp dpt:http redir ports ${C.NGINX_HTTP_PORT}" || true; }`);

    if (!ruleExists) {
      exec(`iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port ${C.NGINX_HTTP_PORT}`, `Adding iptable rule to redirect port 80 on port ${C.NGINX_HTTP_PORT}...`);
      exec(`iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port ${C.NGINX_HTTPS_PORT}`, `Adding iptable rule to redirect port 443 on port ${C.NGINX_HTTPS_PORT}...`);
      exec(`iptables -t nat -I OUTPUT -p tcp -o lo --dport 80 -j REDIRECT --to-port ${C.NGINX_HTTP_PORT}`, `Adding iptable rule to redirect port 80 on port ${C.NGINX_HTTP_PORT} (loopback)...`);
      exec(`iptables -t nat -I OUTPUT -p tcp -o lo --dport 443 -j REDIRECT --to-port ${C.NGINX_HTTPS_PORT}`, `Adding iptable rule to redirect port 443 on port ${C.NGINX_HTTPS_PORT} (loopback)...`);
    }

    // Generate nginx configuration
    exec(() => { fs.writeFileSync(C.NGINX_CONFIG_PATH, generateNginxConfig(sslOn)); fs.chownSync(C.NGINX_CONFIG_PATH, C.UID, C.GID); }, 'Generating Nginx configuration...');

    // Generate SSL certificate if it does not exist
    if (sslOn && (!fs.existsSync(C.SSL_CERT_PATH) || !fs.existsSync(C.SSL_KEY_PATH))) {
      console.log('No certificate found, generating one using certbot...');

      let webroot = startWebRootServer(C.SSL_DIR, C.NGINX_HTTP_PORT);

      let cmd = `certbot certonly -n --agree-tos --email ${C.EMAIL} --webroot -w ${C.SSL_DIR}`;
      C.APP_LIST.forEach(app => cmd += ` -d ${app.fullDomain}`);

      execAsync(cmd, (err, stdout, stderr) => {
        if (err) {
          console.log(stderr);
          console.log(`${err}`);
          process.exit(1);
        }

        console.log(stdout);

        webroot.close();
        exec(`ln -s /etc/letsencrypt/live/${C.APP_LIST[0].fullDomain}/fullchain.pem ${C.SSL_CERT_PATH}`);
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