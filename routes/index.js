/*jshint node:true, laxcomma:true */
"use strict";

var config             = require('../config');
var getInstancesConfig = require('../lib/instances').getInstancesConfig;
var loadJson           = require('../lib/processes').loadJson;
var getPM2JsonPath     = require('../lib/processes').getJsonPath;

/*
 * GET home page.
 */

exports.index = function (req, res) {
  if (!req.user) {
    req.user =  "admin@castorjs.org";
  }
  config.instances = getInstancesConfig();
  config.processes = loadJson(getPM2JsonPath());
  res.render('index',
    { title: 'Accueil'
    , path: '/'
    , userName: req.user
    , config: JSON.stringify(config) });
};
