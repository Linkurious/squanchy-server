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
    try {
      return require(filePath);
    } catch (e) {
      return {};
    }
  }

  function getCredentialsFilePath(subdomain) {
    return path.join(C.CREDENTIAL_DIR, `${subdomain}.credentials.json`);
  }

  exports.check = function (subdomain, username, password) {
    var credentials = tryRequire(getCredentialsFilePath(subdomain));

    return credentials[username] === hash(password);
  };

  exports.add = function (subdomain, username, password) {
    var filePath = getCredentialsFilePath(subdomain),
        credentials = tryRequire(filePath);

    credentials[username] = hash(password);
    fs.writeFileSync(filePath, JSON.stringify(credentials), 'utf8');
  };
})();