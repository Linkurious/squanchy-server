var fs = require('fs');
var path = require('path');
var pem = require('pem');
var mkdirp = require('mkdirp');
var sleep = require('sleep');

exports.load = function (keyFile, certFile, callback) {
  var keyExists = fs.existsSync(keyFile),
      certExists = fs.existsSync(certFile);

  var key, cert;

  if (!keyExists || !certExists) {
    process.stdout.write('Generating SSL certificate...');

    mkdirp(path.dirname(keyFile));
    mkdirp(path.dirname(certFile));

    pem.createCertificate({days: 365, selfSigned: true}, (err, keys) => {
      fs.writeFileSync(keyFile, keys.serviceKey, {encoding: 'utf8'});
      fs.writeFileSync(certFile, keys.certificate, {encoding: 'utf8'});

      key = keys.serviceKey;
      cert = keys.certificate;

      console.log(' Ok.');
      callback({ key, cert });
    });

  } else {
    process.stdout.write('Loading SSL certificate...');

    key = fs.readFileSync(keyFile);
    cert = fs.readFileSync(certFile);

    console.log(' Ok.');
    callback({ key, cert });
  }
};