(function () {
  const prompt = require('prompt');
  const credentials = require('./src/credentials');
  const C = require('./src/config');

  function exit(code, msg) {
    console.error(msg);
    process.exit(code);
  }

  var argv = process.argv.slice(2),
      command = argv[0],
      user = argv[1], subdomain = argv[2];

  if (command === 'add') {
    if (argv.length < 2) exit(1, `Usage: node user.js add <username> [<sub-domain>]`);

    prompt.start();
    prompt.get({
      properties: {
        password: {
          description: 'Enter the password',
          required: true,
          hidden: true
        }
      }
    }, function (err, result) {
      if (err) {
        console.error(err);
        process.exit(3);
      }

      var password = result.password;

      if (!subdomain) {
        C.APPS.forEach(app => credentials.add(app, user, password));
      } else if (C.APPS.indexOf(subdomain) === -1) {
        exit(2, `sub-domain "${subdomain}" is not registered`);
      } else {
        credentials.add(subdomain, user, password);
      }
    });

  } else if (command === 'del') {
    if (argv.length < 1) exit(1, `Usage: node user.js del <username> [<sub-domain>]`);

    if (!subdomain) {
      C.APPS.forEach(app => credentials.remove(app, user));
    } else if (C.APPS.indexOf(subdomain) === -1) {
      exit(2, `sub-domain "${subdomain}" is not registered`);
    } else {
      credentials.remove(subdomain, user);
    }
  } else {
    exit(1, `Usage:\n* node user.js add <username> <password> [<sub-domain>]\n* node user.js del <username> [<sub-domain>]`);
  }
})();