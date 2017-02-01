/**
 * LINKURIOUS CONFIDENTIAL
 * Copyright Linkurious SAS 2012 - 2016
 *
 * - Created by francesco on 01/02/17.
 */
'use strict';

const fs = require('fs');

/**
 * Respond with the homepage if it exists and replace:
 * //SET-ERROR
 * with
 * error = 404;
 *
 * @param rootDirectory
 * @param req
 * @param res
 */
module.exports = (rootDirectory, req, res) => {
  fs.readFile(rootDirectory + '/index.html', 'utf8', (err, homepage) => {
    if (err) {
      res.status(404).send('Not Found');
    } else {
      res.status(404).send(homepage.replace('//SET-ERROR', 'error = 404;'));
    }
  });
};
