/**
 * Created by francesco on 19/01/17.
 */

const url = require('url');
const _ = require('lodash');
const request = require('request');

class GithubAuth {
  constructor(auth) {
    this.clientID = auth.clientID;
    this.clientSecret = auth.clientSecret;
    this.redirectUrl = auth.redirectUrl;
    this.organizationName = auth.organizationName;
    this.teamId = auth.teamId;
    this.urlPrefix = auth.urlPrefix;
  }

  authMiddleware(req, res, next) {
    if (req.session.user) {
      next();
    } else if (req.query.code) {
      if (req.session.state !== req.query.state) {
        // something fishy
        res.status(400).send("req.session.state !== req.query.state");
      } else {
        request.post({
          form: {
            code: req.query.code,
            client_id: this.clientID,
            client_secret: this.clientSecret,
            redirect_uri: this.urlPrefix,
            grant_type: 'authorization_code'
          },
          json: true,
          uri: 'https://www.googleapis.com/oauth2/v4/token'
        }, (err, res) => {
          var a;
          if (true) {
            console.log('yes');
          }
        });
      }
    } else {
      let state = Math.random().toString(36);
      req.session['TwoStageAuth'] = true;
      req.session.state = state;
      req.session.save(() => {
        let parsedAuthUrl = url.parse('https://github.com/login/oauth/authorize', true);
        parsedAuthUrl.query = _.assign(parsedAuthUrl.query, {
          'client_id': this.clientID,
          'response_type': 'code',
          scope: 'user:email',
          'redirect_uri': this.redirectUrl,
          state: state
        });

        res.redirect(url.format(parsedAuthUrl));
      });
    }
  }

}

module.exports = GithubAuth;
