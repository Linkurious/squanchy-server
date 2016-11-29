(function () {
  const credentials = require('./src/credentials');
  const C = require('./src/config');

  function exit(code, msg) {
    console.error(msg);
    process.exit(code);
  }

  var argv = process.argv.slice(2),
      command = argv[0],
      subdomain, user, password;

  if (command === 'add') {
    if (argv.length < 3) exit(1, `Usage: node user.js add <username> <password> [<sub-domain>]`);

    user = argv[1];
    password = argv[2];
    subdomain = argv[3];

    if (!subdomain) {
      C.APPS.forEach(app => credentials.add(app, user, password));
    } else if (C.APPS.indexOf(subdomain) === -1) {
      exit(2, `sub-domain "${subdomain}" is not registered`);
    } else {
      credentials.add(subdomain, user, password);
    }

  } else if (command === 'del') {
    if (argv.length < 2) exit(1, `Usage: node user.js del <username> [<sub-domain>]`);

    user = argv[1];
    subdomain = argv[2];

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