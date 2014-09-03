/*jshint node:true*/
'use strict';

var debug  = require('debug')('castor:admin:processes');
var util   = require('util');
var fs     = require('fs');
var path   = require('path');
var errors = require('./errors');
var config = require('../config');

/**
 * Load a JSON file and returns its content.
 *
 * Does not cache the file, whereas raw require does.
 *
 * @param  {String} json_path Path of the JSON file
 * @return {Object|Array}     Content of the JSON file
 */
var loadJson = function(json_path) {
  if (require.cache[json_path] !== undefined) {
    delete require.cache[json_path];
  }
  var json = require(json_path);
  return json;
};

/**
 * Add an instance to the PM2 JSON configuration file.
 * @param {String} id        Instance's identifier
 * @param {Number} port      Instance's port
 * @param {String} json_path PM2 JSON configuration file
 * @param {Function} cb      Callback(err, configuration)
 */
module.exports.addInstanceToJson = function(id, port, json_path, cb) {
  if (typeof(id) !== "string") {
    cb(new errors.BadParameters('addInstanceToJson(id): id should be a string'));
    return;
  }
  if (typeof(port) !== "number") {
    cb(new errors.BadParameters('addInstanceToJson(port): port should be a number'));
    return;
  }
  if (typeof(json_path) !== "string") {
    cb(new errors.BadParameters('addInstanceToJson(json_path): json_path should be a string'));
    return;
  }

  var cwd = path.resolve(__dirname, '..');
  var json;
  try {
    json = loadJson(json_path);
  }
  catch(err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      debug("File " + json_path + " does not exist.");
      // create the initial configuration file
      json = {
        apps: [{
          name:             "admin",
          script:           cwd + "/app.js",
          cwd:              cwd,
          node_args:        [],
          exec_mode:        "fork_mode",
          exec_interpreter: "node"
        }]
      };
    }
    else {
      cb(err);
      return;
    }
  }

  var instances_path = config.instances_path;
  var instance_path = path.join(instances_path, id);
  var instance = {
    name:             id,
    script:           "castor",
    cwd:              cwd,
    node_args:        [],
    exec_mode:        "fork_mode",
    exec_interpreter: "none",
    args:             util.format("[\"%s\",\"--theme\",\"theme\"]", instance_path),
    watch:            util.format("%s.json", instance_path),
    port:             port
  };
  if (!json.apps) {
    cb(new errors.BadParameters(
      util.format('addInstanceToJson(%s): "apps" key is lacking', json_path))
    );
    return;
  }
  json.apps.push(instance);
  var json_string = JSON.stringify(json, null, '  ');
  fs.writeFile(json_path, json_string, function writeFileCb(err) {
    if (err) {
      cb(err);
      return;
    }
    cb(null, json);
  });
};

/**
 * Delete an instance from the PM2 JSON configuration file.
 * @param {String} id        Instance's identifier
 * @param {String} json_path PM2 JSON configuration file
 * @param {Function} cb      Callback(err, configuration)
 */
module.exports.deleteInstanceFromJson = function(id, json_path, cb) {
  if (typeof(id) !== "string") {
    cb(new errors.BadParameters('deleteInstanceFromJson(id): id should be a string'));
    return;
  }
  if (id === 'admin') {
    cb(new errors.Forbidden('deleteInstanceFromJson(admin): admin cannot be removed'));
    return;
  }
  if (typeof(json_path) !== "string") {
    cb(new errors.BadParameters('deleteInstanceFromJson(json_path): json_path should be a string'));
    return;
  }

  var json;
  try {
    json = loadJson(json_path);
  }
  catch(err) {
    cb(err);
    return;
  }

  if (!json.apps) {
    cb(new errors.BadParameters(
      util.format('deleteInstanceFromJson(%s): "apps" key is lacking', json_path))
    );
    return;
  }
  var new_apps = json.apps.filter(function removeOneInstance(app) {
    if (app.name !== id) {
      return app;
    }
  });
  json.apps = new_apps;
  var json_string = JSON.stringify(json, null, '  ');
  fs.writeFile(json_path, json_string, function writeFileCb(err) {
    if (err) {
      cb(err);
      return;
    }
    cb(null, json);
  });
};

/**
 * Get the path for PM2 configuration JSON file.
 * @return {String} PM2 configuration file path
 */
module.exports.getJsonPath = function() {
  return config.instances_path + ".json";
};
