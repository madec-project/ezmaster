/*jshint node:true, laxcomma:true */
"use strict";

var config = require('../config');
var getInstancesConfig = require('../lib/instances.js').getInstancesConfig;

/*
 * GET home page.
 */

exports.index = function (req, res) {
  if (!req.user) {
    req.user =  "admin@castorjs.org";
  }
  config.instances = getInstancesConfig();
  res.render('index',
    { title: 'Accueil'
    , path: '/'
    , userName: req.user
    , config: config });
};