/**
 * Created by francesco on 19/01/17.
 */

const url = require('url');
const _ = require('lodash');
let request = require('request');

request = request.defaults({
  json: true,
  headers: {
    'User-Agent': 'Squanchy-Server Auth'
  }
});

class GithubAuth {
  constructor(auth, domain) {
    this.clientID = auth.clientID;
    this.clientSecret = auth.clientSecret;
    this.redirectUrl = auth.redirectUrl;
    this.apiEndpoint = auth.apiEndpoint;
    this.urlPrefix = auth.urlPrefix;
    this.alternativeAccessToken = auth.alternativeAccessToken;
    this.domain = domain;
  }

  isAuthenticated(req) {
    return !!(req.session.user &&
        req.session.user.domains &&
        req.session.user.domains.indexOf(this.domain) !== -1);
  }

  checkMembership(accessToken, username, cb) {
    var apiEndpointPopulated = this.apiEndpoint.replace('{{username}}', username);
    var tokenToUse = this.alternativeAccessToken !== undefined && this.alternativeAccessToken !== null
        ? this.alternativeAccessToken
        : accessToken;

    request.get(
      `https://api.github.com` + apiEndpointPopulated,
      {
        qs: {'access_token': tokenToUse},
        headers: {'Authorization': tokenToUse}
      },
      (err, res) => {
        if (err) {
          return cb(err);
        }

        cb(null, [200, 204].indexOf(res.statusCode) >= 0);
      }
    );
  }

  getUsername(accessToken, cb) {
    request.get(
      'https://api.github.com/user',
      {
        qs: {'access_token': accessToken},
        headers: {'Authorization': accessToken}
      },
      (err, userR) => {
        if (err) {
          return cb(err);
        }

        cb(null, userR.body && userR.body.login);
      }
    );
  }

  getAccessToken(code, cb) {
    request.post({
      form: {
        code: code,
        client_id: this.clientID,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUrl,
        grant_type: 'authorization_code'
      },
      uri: 'https://github.com/login/oauth/access_token'
    }, (err, accessTokenRes) => {
      if (err) {
        return cb(err);
      }

      cb(null, accessTokenRes.body && accessTokenRes.body.access_token);
    });
  }

  authorizeDomainForUser(req, username, cb) {
    if (req.session.user === undefined || req.session.user === null) {
      req.session.user = {
        id: username,
        domains: []
      }
    }

    req.session['TwoStageAuth'] = false;
    req.session.user.domains.push(this.domain);
    req.session.save(cb);
  }

  createUserSession(req, cb) {
    let state = Math.random().toString(36);
    req.session['TwoStageAuth'] = true;
    req.session.state = state;
    req.session.desiredResource = req.originalUrl;
    req.session.save(() => {
      cb(null, state);
    });
  }

  authenticate(state, res) {
    let parsedAuthUrl = url.parse('https://github.com/login/oauth/authorize', true);
    parsedAuthUrl.query = _.assign(parsedAuthUrl.query, {
      'client_id': this.clientID,
      'response_type': 'code',
      scope: 'user:email read:org',
      'redirect_uri': this.redirectUrl,
      state: state
    });

    res.redirect('/auth?redirect_uri=' +
        encodeURIComponent(url.format(parsedAuthUrl)));
  }

  authMiddleware(req, res, next) {
    if (this.isAuthenticated(req)) {
      next();
    } else if (req.query.code) {
      if (req.session.state !== req.query.state) {
        // something fishy, or more simply someone is not using the right URL
        res.status(400).send("req.session.state !== req.query.state");
      } else {
        this.getAccessToken(req.query.code, (err, accessToken) => {
          if (err) {
            return res.status(400).send(err.message);
          }

          this.getUsername(accessToken, (err, username) => {
            if (err) {
              return res.status(400).send(err.message);
            }

            this.checkMembership(accessToken, username, (err, isMember) => {
              if (err) {
                return res.status(400).send(err.message);
              }

              if (isMember) {
                this.authorizeDomainForUser(req, username, () => {
                  res.redirect(req.session.desiredResource);
                });
              } else {
                res.redirect('/auth');
              }
            });
          });
        });
      }
    } else {
      this.createUserSession(req, (err, state) => {
        // redirect the user to Github for authorization
        this.authenticate(state, res);
      });
    }
  }

}

module.exports = GithubAuth;
