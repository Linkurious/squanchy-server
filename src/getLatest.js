/**
 * Created by francesco on 19/01/17.
 */

const fs = require('fs');

/**
 * @param {string} x a string in the format "a.b.c" or "va.b.c"
 * @param {string} y a string in the format "d.e.f" or "vd.e.f"
 * @returns {number} similar to (x-y): <0 if x<y, >0 if x<y, 0 if x=y
 */
function semVerComparator(x, y) {
  x = x.indexOf('v') === 0 ? x.slice(1) : x;
  y = y.indexOf('v') === 0 ? y.slice(1) : y;
  var xa = x.split('.').map(function(s) { return parseInt(s, 10); });
  var ya = y.split('.').map(function(s) { return parseInt(s, 10); });
  for (var i = 0, l = Math.min(xa.length, ya.length); i < l; ++i) {
    if (ya[i] !== xa[i]) { return xa[i] - ya[i]; }
  }
  return 0;
}

function isSemVer(x) {
  return semVerComparator(x, 'v0.0.0.0') >= 0;
}

class GetLatest {
  constructor(rootDir) {
    this.rootDir = rootDir;
  }

  /**
   * @returns {function(*, *, *)}
   */
  getMiddleware() {
    return (req, res, next) => {
      let originalUrl = req.originalUrl;
      let idxLatest = originalUrl.indexOf('latest');
      if (idxLatest === -1) {
        next();
      } else {
        let pathUpToLatest = originalUrl.slice(0, idxLatest);
        let pathAfterLatest = originalUrl.slice(idxLatest + 6);

        let directoryToCheck = this.rootDir + pathUpToLatest;

        let versionFound = null;

        fs.readdir(directoryToCheck, (err, files) => {
          if (files) {
            files.forEach(file => {
              if (isSemVer(file)) {
                if (versionFound === null) {
                  versionFound = file;
                } else {
                  versionFound = semVerComparator(versionFound, file) > 0 ? versionFound : file;
                }
              }
            });

            if (versionFound === null) {
              res.status(404).send('No versions of this resource were found');
            } else {
              res.redirect(pathUpToLatest + versionFound + pathAfterLatest);
            }
          }
        });
      }
    };
  }
}

module.exports = GetLatest;
