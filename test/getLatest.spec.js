/**
 * LINKURIOUS CONFIDENTIAL
 * Copyright Linkurious SAS 2012 - 2018
 *
 * - Created on 2018-11-15.
 */
'use strict';

const Getlatest = require('../src/getLatest');
const path = require('path');

const latest = new Getlatest(path.resolve(__dirname, 'test-root'));

function assertEqual(name, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${name} does not match. Actual: ${actual}. Expected: ${expected}`);
  }
}

class Req {
  constructor(originalUrl) {
    this.originalUrl = originalUrl;
    this.url = originalUrl;
  }
}

class Res {
  constructor() {
    this._status = null;
    this._body = null;
  }

  status(code) {
    this._status = code;
    return this;
  }

  send(body) {
    this._body = body;
    return this;
  }

  /**
   * @param {number|null} status
   * @param {string|null} [body]
   */
  check(status, body)  {
    assertEqual('Status', this._status, status);
    if (body !== undefined) {
      assertEqual('Body', this._body, body);
    }
  }
}

function testSuccess(middleware, originalUrl, targetUrl) {
  const req = new Req(originalUrl);
  const res = new Res();
  middleware(req, res,() => {
    assertEqual('URL', targetUrl, req.url);
    res.check(null, null);
  });
}

function testFailure(middleware, originalUrl) {
  const req = new Req(originalUrl);
  const res = new Res();
  middleware(req, res,() => {
    res.check(400, 'No versions of this resource were found');
  });
}

describe("getLatest middleware", function() {

  const middleware = latest.getMiddleware({'sub3': '1.2.3'});

  it('should get a regular path', function() {
    testSuccess(middleware, '/sub1/1.20.3', '/sub1/1.20.3');
  });

  it('should resolve "latest" to the newest semver', function() {
    testSuccess(middleware, '/sub1/latest', '/sub1/2.0.0');
  });

  it('should fail to resolve "latest" if the parent folder is empty', function() {
    testFailure(middleware, '/sub2/latest');
  });

  it('should resolve a regular path, even if it does not exist', function() {
    testSuccess(middleware, '/sub2/1.1.1', '/sub2/1.1.1');
  });

  it('should resolve "latest" to a manually overwritten value', function() {
    testSuccess(middleware, '/sub3/latest', '/sub3/1.2.3');
  });

  it('should resolve regular path even when "latest" is manually overwritten', function() {
    testSuccess(middleware, '/sub3/1.2.3', '/sub3/1.2.3');
  });
});
