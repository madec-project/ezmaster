/*jshint node:true, laxcomma:true */
"use strict";

var config             = require('../config');
var getInstancesConfig = require('../lib/instances').getInstancesConfig;
var loadJson           = require('../lib/processes').loadJson;
var getPM2JsonPath     = require('../lib/processes').getJsonPath;
var fs                 = require('fs');
var home               = process.env.HOME;

/*
 * GET home page.
 */


/**
 * Get list of apps in ~/apps folder
 *
 * An app is a particular version of a castor theme, installed in a
 * folder possibly using some convention (themeName@version).
 *
 * @param  {String} folder Path of the apps
 * @return {Array}         Name of apps (folders within folder)
 */
var getApps = function getApps(folder) {

  var apps = fs.readdirSync(folder);
  apps = apps.filter(function(file){
    if((fs.statSync(folder+'/'+file).isDirectory())) {
      if(fs.existsSync(folder+'/'+file+'/cli')){
        if(fs.existsSync(folder+'/'+file+'/node_modules/')){
          return file.toLowerCase();
        }
      }
    }
  });
  apps =apps.sort().reverse();
  console.log(apps);
  return apps;

};



exports.index = function (req, res) {
  // check if ~/apps folder exists
  var apps = fs.existsSync(home + '/apps') ? home + '/apps' : null ;

  // If Apps folder exists
  if(apps){
      apps = getApps(apps); // Get ONLY directories (which contain cli) in ~/apps
  }

  if (!req.user) {
    req.user =  "admin@castorjs.org";
  }
  delete config.instances;
  res.render('index',
    { title: 'Accueil'
    , apps: apps
    , path: '/'
    , userName: req.user
    , config: JSON.stringify(config) });
};
