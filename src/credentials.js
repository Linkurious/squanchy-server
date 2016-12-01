(function () {
  const fs = require('fs');
  const path = require('path');
  const crypto = require('crypto');
  const C = require('./config');

  const SHA256_SALT = 'sand-castle';

  function hash(password) {
    var sum = crypto.createHash('sha256');
    sum.update(password + SHA256_SALT);
    return sum.digest('hex');
  }

  function tryRequire(filePath) {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } else {
      return {};
    }
  }

  function getCredentialsFilePath(subdomain) {
    return path.join(C.CREDENTIAL_DIR, `${subdomain}.credentials.json`);
  }

  function check(subdomain, username, password) {
    var credentials = tryRequire(getCredentialsFilePath(subdomain));

    return credentials[username] === hash(password);
  }

  exports.check = function (subdomain, username, password) {
    return check(subdomain, username, password) || check('all', username, password);
  };

  exports.hasAccess = function (subdomain, username) {
    var credentials = tryRequire(getCredentialsFilePath(subdomain));

    return !!credentials[username];
  };

  exports.list = function (subdomain) {
    return Object.keys(tryRequire(getCredentialsFilePath(subdomain)));
  };

  exports.add = function (subdomain, username, password) {
    var filePath = getCredentialsFilePath(subdomain),
        credentials = tryRequire(filePath);

    credentials[username] = hash(password);
    fs.writeFileSync(filePath, JSON.stringify(credentials, null, ' '), 'utf8');
  };

  exports.remove = function (subdomain, username) {
    var filePath = getCredentialsFilePath(subdomain),
        credentials = tryRequire(filePath);

    credentials[username] = undefined;
    fs.writeFileSync(filePath, JSON.stringify(credentials, null, ' '), 'utf8');
  }
})();