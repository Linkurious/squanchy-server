(function () {
  const credentials = require('./src/credentials');

  function exit(code, msg) {
    console.error(msg);
    process.exit(code);
  }

  var argv = process.argv.slice(2);

  if (argv.length < 3) {
    exit(1, `Usage: node add_user.js <sub-domain> <username> <password>`);
  }

  const C = require('./src/config'),
        subdomain = argv[0],
        user = argv[1],
        password = argv[2];

  if (!C.APPS[subdomain]) {
    exit(2, `sub-domain "${subdomain}" is not registered`);
  }

  credentials.add(subdomain, user, password);
})();