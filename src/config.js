var fs = require('fs');
var path = require('path');

function err(msg, exitCode) {
  console.log('\n\033[91mError: ' + msg + '.\033[0m');
  process.exit(exitCode);
}

exports.load = function (configPath, callback) {
  var configFile, config;

  process.stdout.write(`Loading configuration from ${configPath}...`);

  try {
    configFile = fs.readFileSync(configPath);
  } catch (e) {
    err(`file not found`, 1);
  }

  try {
    config = JSON.parse(configFile);
  } catch (e) {
    err('not valid JSON', 2);
  }

  if (typeof config.user !== 'string') {
    err('the `user` property must be a string', 3);
  }

  if (typeof config.password !== 'string') {
    err('the `password` property must be a string', 4);
  }

  if (config.http_port !== undefined && typeof config.http_port !== 'number') {
    err('the `http_port` property must be a number', 5);
  }

  if (config.https_port !== undefined && typeof config.https_port !== 'number') {
    err('the `https_port` property must be a number', 6);
  }

  if (config.root !== undefined && typeof config.root !== 'string') {
    err('the `root` property must be a string', 6);
  }

  console.log(' Ok.');

  if (!config.root) config.root = 'files';

  if (config.root.indexOf('/') !== 0) {
    config.root = path.join(path.dirname(configPath), config.root);
  }

  callback({
    user: config.user,
    password: config.password,
    http_port: config.http_port || 80,
    https_port: config.https_port || 443,
    root: config.root
  });
};