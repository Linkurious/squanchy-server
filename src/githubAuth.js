/**
 * Created by francesco on 19/01/17.
 */

const url = require('url');
const _ = require('lodash');
let request = require('request');

request = request.defaults({
  json: true,
  headers: {
    'User-Agent': 'LK Documentation'
  }
});

class GithubAuth {
  constructor(auth, domain) {
    this.clientID = auth.clientID;
    this.clientSecret = auth.clientSecret;
    this.redirectUrl = auth.redirectUrl;
    this.teamId = auth.teamId;
    this.urlPrefix = auth.urlPrefix;
    this.domain = domain;
  }

  authMiddleware(req, res, next) {
    if (req.session.user &&
        req.session.user.domains &&
        req.session.user.domains.indexOf(this.domain) !== -1) {
      next();
    } else if (req.query.code) {
      if (req.session.state !== req.query.state) {
        // something fishy, or more simply someone is not using the right URL
        res.status(400).send("req.session.state !== req.query.state");
      } else {
        request.post({
          form: {
            code: req.query.code,
            client_id: this.clientID,
            client_secret: this.clientSecret,
            redirect_uri: this.redirectUrl,
            grant_type: 'authorization_code'
          },
          uri: 'https://github.com/login/oauth/access_token'
        }, (err, accessTokenRes) => {
          if (err) {
            return res.status(400).send(err.message);
          }

          let accessToken = accessTokenRes.body && accessTokenRes.body.access_token;

          request.get('https://api.github.com/user',
              {qs: {'access_token': accessToken}}, (err, userR) => {
            let username = userR.body && userR.body.login;

            request.get(`https://api.github.com/teams/${this.teamId}/memberships/${username}`,
                {qs: {'access_token': accessToken}}, (err, membershipR) => {
              let statusMembership = membershipR.body && membershipR.body.state;
              if (statusMembership === 'active') {
                if (req.session.user === undefined || req.session.user === null) {
                  req.session.user = {
                    domains: []
                  }
                }
                req.session.user.domains.push(this.domain);

                req.session.save(() => {
                  res.redirect(req.session.desiredResource);
                });
              } else {
                res.redirect('/resources/auth.html');
                // res.status(403).send("You are not authorized to see this resource");
              }
            });
          });
        });
      }
    } else {
      let state = Math.random().toString(36);
      req.session['TwoStageAuth'] = true;
      req.session.state = state;
      req.session.desiredResource = req.originalUrl;
      req.session.save(() => {
        let parsedAuthUrl = url.parse('https://github.com/login/oauth/authorize', true);
        parsedAuthUrl.query = _.assign(parsedAuthUrl.query, {
          'client_id': this.clientID,
          'response_type': 'code',
          scope: 'user:email read:org',
          'redirect_uri': this.redirectUrl,
          state: state
        });

        res.redirect('/resources/auth.html?redirect_uri=' +
            encodeURIComponent(url.format(parsedAuthUrl)));
      });
    }
  }

}

module.exports = GithubAuth;
