/**
 * LINKURIOUS CONFIDENTIAL
 * Copyright Linkurious SAS 2012 - 2017
 *
 * - Created by david on 2017-01-24.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const template = fs.readFileSync(
  path.resolve(__dirname, 'resources', 'auth.html'),
  {encoding: 'utf8'}
);

class AuthPage {

  /**
   * @param {object} app
   * @param {string} app.name
   * @param {string} app.domain
   * @param {string} app.fullDomain
   * @param {boolean} app.ssl
   */
  constructor(app) {
    this.authPage = template
      .replace(/\{\{fullDomain}}/g, app.fullDomain)
      .replace(/\{\{name}}/g, app.name);
  }

  /**
   * @returns {function(*, *)}
   */
  getMiddleware() {
    return (req, res) => {
      res.set('Content-Type', 'text/html');
      res.status(200).send(this.authPage)
    };
  }
}

module.exports = AuthPage;
