/*jslint node:true, maxlen:150, maxerr:50, indent:2, laxcomma:true, white:true  */
'use strict';

var sugar = require('sugar');
var config = require('../config');
var http = require('http');
var fs = require('fs');
var path = require('path');
// var cas = require('../middleware/casauth');
var util = require('util');
var debug = require('debug')('castor:admin:upload');
var getInstancesConfig = require('../lib/instances.js').getInstancesConfig;
var getUpdatableInstances = require('../lib/instances.js').getUpdatableInstances;

module.exports = function (server) {

  // GET upload form
  var getUploadInstance = function getUploadInstance (req, res) {
    if(!req.user) {
      req.user =  "admin@castorjs.org";
    }

    config.instances = getInstancesConfig();
    
    config.instances = getUpdatableInstances(config.instances, req.user);

    var fl = req.flash();
    debug('req.flash()', fl);
    res.render('upload', {
        title: 'Upload'
      , status: fl
      , instance: req.params.instance
      , path: '/upload'
      , config: config
      , userName: req.user
      , host: req.host
      });

  };

  server.get('/upload/:instance'/*, cas.casauth({root: config.cas_server})*/, getUploadInstance);

  server.get('/upload', /*cas.casauth({root: config.cas_server}),*/getUploadInstance);


  // POST upload
  server.post('/upload', /*cas.casauth({root: config.cas_server}),*/ function (req, res) {
    config.instances = getInstancesConfig();
    var instance = req.body.instance;

    debug('POST /upload');
    var status = "Please select a file to send!";
    var alertType = "";

    if (req.files.notices.size === 0)
    {
      req.flash('error', "Please select a file to send!");
      if (instance) {
        res.redirect("/upload/" + instance);
      }
      else {
        res.redirect("/upload");
      }
    } else {
      debug("req.params",req.params);
      debug("req.body", req.body);
      debug('instance', instance);
      // check if instance is in config.instances
      var instancesList = Object.keys(config.instances);
      if (instancesList.indexOf(instance) === -1) {
        req.flash('error', "The " + instance + " instance does not have any configuration file!");

        if (instance) {
          res.redirect("/upload/" + instance);
        }
        else {
          res.redirect("/upload");
        }
        return;
      }

      // move to the instance directory
      var upload_path = path.resolve(__dirname, '..', config.instances_path, instance);
      var target_path = path.join(
          upload_path + '/',
          path.basename(req.files.notices.name)
        );
      debug('req.files.notices.path',req.files.notices.path);
      debug('target_path',target_path);
      fs.rename(req.files.notices.path, target_path, function (err) {
        if (!err) {
          var message = 'The file "' + req.files.notices.name +
                        '" has been uploaded.';
          req.flash('success', message);
        }
        else {
          // Flash messages
          if (typeof err === 'object') {
            err = err.message;
          }
          err = err + ' (' + req.files.notices.name + ')';
          req.flash('error', err);
        }
        debug("redirect");
        res.redirect("/upload/" + instance);
      });
    }
  });
};
