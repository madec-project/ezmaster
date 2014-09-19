/*jslint node:true, maxlen:150, maxerr:50, indent:2, laxcomma:true, white:true  */
'use strict';

var debug  = require('debug')('castor:admin:upload');
var sugar  = require('sugar');
var async  = require('async');
var config = require('../config');
var http   = require('http');
var path   = require('path');
var util   = require('util');
var mv     = require('mv');
// var cas = require('../middleware/casauth');
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
      var notices = req.files.notices;
      if (!util.isArray(notices)) {
        notices = [notices];
      }
      async.map(notices, function mvFile(notice, cb) {
        var target_path = path.join(
          upload_path + '/',
          path.basename(notice.name)
        );
        mv(notice.path, target_path, function afterMv(err) {
          if (!err) {
            var message = 'The file "' + notice.name +
                          '" has been uploaded. ';
            req.flash('success', message);
          }
          cb(err);
        });
      }, function errorInMv(err, results) {
        debug(err);
        if (err) {
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
