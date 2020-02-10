/**
 * Created by francesco on 19/01/17.
 */

const _ = require('lodash');
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

  fail(res) {
    res.status(404).send('No versions of this resource were found');
  }

  redirectLatest(context, req, next) {
    req.url = context.pathUpToLatest + context.latest + context.pathAfterLatest;
    next();
  }

  /**
   * @param {object} overrideLatest Versions to set as latest indexed by folder name
   * @returns {function(*, *, *)}
   */
  getMiddleware(overrideLatest) {
    return (req, res, next) => {
      let originalUrl = req.originalUrl;
      let originalUrlWithoutQS = originalUrl.split("?").shift();
      let idxLatest = originalUrlWithoutQS.indexOf('latest');

      if (idxLatest === -1) {
        // https://github.com/Linkurious/documentation/issues/70
        // if "latest" is not found in the url path it means it's a specific version
        // we don't want specific versions to appear in Google, only latest
        
        // if originalUrl.length is 1, it's the home page of and we want Google to index it
        if (originalUrl.length > 1) {
          res.set('X-Robots-Tag', 'noindex');
        }

        return next();
      }

      let context = {
        pathUpToLatest: originalUrl.slice(0, idxLatest),
        pathAfterLatest: originalUrl.slice(idxLatest + 6),
        latest: null
      };

      _.forEach(_.keys(overrideLatest), folderName => {
        if (originalUrl.indexOf('/' + folderName + '/latest') >= 0) {
          context.latest = overrideLatest[folderName];
        }
      });
      if (context.latest) {
        return this.redirectLatest(context, req, next)
      }

      const directoryToCheck = this.rootDir + context.pathUpToLatest;
      fs.readdir(directoryToCheck, (err, folderNames) => {
        if (!folderNames) {
          return this.fail(res);
        }

        const sortedVersions = folderNames.filter(isSemVer).sort(semVerComparator);
        context.latest = sortedVersions.length ? sortedVersions[sortedVersions.length - 1] : null;
        if (!context.latest) {
          return this.fail(res);
        }

        this.redirectLatest(context, req, next);
      });
    };
  }
}

module.exports = GetLatest;
