/**
 * Created by francesco on 19/01/17.
 */

class GetLatest {
  constructor(rootDir) {
    this.rootDir = rootDir;
  }

  getLatestMiddleware(req, res, next) {
    let originalUrl = req.originalUrl;
    let idxLatest = originalUrl.indexOf('latest');
    if (idxLatest === -1) {
      next();
    } else {
      let pathUpToLatest = originalUrl.slice(0, idxLatest);

      var a;
    }
  }
}

module.exports = GetLatest;
