/**
 * LINKURIOUS CONFIDENTIAL
 * Copyright Linkurious SAS 2012 - 2016
 *
 * - Created by francesco on 01/02/17.
 */
'use strict';

/**
 * If a page is not found redirect to homepage with the originalUrl as querystring parameter
 *
 * @param req
 * @param res
 */
module.exports = (req, res) => {
  res.redirect('/?originalUrl=' + req.originalUrl);
};
