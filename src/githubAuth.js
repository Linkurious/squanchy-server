/**
 * Created by francesco on 19/01/17.
 */

const url = require('url');
const _ = require('lodash');

class GithubAuth {
  constructor(auth) {
    this.clientID = auth.clientID;
    this.clientSecret = auth.clientSecret;
    this.redirectUrl = auth.redirectUrl;
    this.organizationName = auth.organizationName;
    this.teamId = auth.teamId;
  }

  authMiddleware(req, res, next) {
    if (req.session.user) {
      next();
    } else if (req.param.code) {
      console.log(req.param.code);
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
