var fs = require('fs');
var path = require('path');

exports.load = function () {
  var configFile, config, username, password, port;

  try {
    configFile = fs.readFileSync(path.join(__dirname, '..', 'config.json'));
  } catch (e) {
    console.error('config.json not found.');
    process.exit(1);
  }

  try {
    config = JSON.parse(configFile);
  } catch (e) {
    console.error('config.json is not valid JSON.');
    process.exit(2);
  }

  if (typeof config.user !== 'string') {
    console.error('config.json: the `user` property must be a string.');
    process.exit(3);
  }

  if (typeof config.password !== 'string') {
    console.error('config.json: the `password` property must be a string.');
    process.exit(4);
  }

  if (config.port !== undefined && typeof config.port !== 'number') {
    console.error('config.json: the `port` property must be a number.');
    process.exit(5);
  }

  return {
    user: config.user,
    password: config.password,
    port: config.port || 3001
  };
};