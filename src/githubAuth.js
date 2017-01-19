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
    this.teamName = auth.teamName;
    this.urlPrefix = auth.urlPrefix;
  }

  authMiddleware(req, res, next) {
    if (req.session.user) {
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
          json: true,
          uri: 'https://github.com/login/oauth/access_token'
        }, (err, accessTokenRes) => {
          if (err) {
            return res.status(400).send(err.message);
          }

          let accessToken = accessTokenRes.body && accessTokenRes.body.access_token;

          request.get({
            headers: {'Authorization': 'token ' + accessToken},
            json: true,
            uri: `https://api.github.com/orgs/${this.organizationName}/teams`
          }, (err, organizationRes) => {
            if (err) {
              return res.status(400).send(err.message);
            }

            if (organizationRes.statusCode === 200) {
              // we get the team id from the team name
              let teamId = null;
              let teams = organizationRes.body;
              for (var i = 0; i < teams.length; i++) {
                if (teams[i].name === this.teamName) {
                  teamId = teams[i].id;
                  break;
                }
              }

              if (teamId === null) {
                // the team doesn't belong to the organization
                return res.status(500).send(`Critical error: team ${this.teamName} doesn't belong to ${this.organizationName}`);
              }


            } else {
              // if a user can't see the team, it doesn't belongs to the organization
              return res.status(403).send('You don\'t have access right to this resource.');
            }
          });
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
          scope: 'user:email read:org',
          'redirect_uri': this.redirectUrl,
          state: state
        });

        res.redirect(url.format(parsedAuthUrl));
      });
    }
  }

}

module.exports = GithubAuth;
