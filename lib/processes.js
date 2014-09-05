/*jshint node:true*/
'use strict';

var debug  = require('debug')('castor:admin:processes');
var util   = require('util');
var fs     = require('fs');
var path   = require('path');
var pm2    = require('pm2');
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
    script:           "node_modules/.bin/castor",
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
  return path.resolve(__dirname, '..', config.instances_path + ".json");
};

/**
 * Get an instance from the PM2 JSON configuration file.
 * @param {String} id        Instance's identifier
 * @param {String} json_path PM2 JSON configuration file
 * @param {Function} cb      Callback(err, configuration)
 */
module.exports.getInstanceFromJson = function(id, json_path, cb) {
  if (typeof(id) !== "string") {
    cb(new errors.BadParameters('getInstanceFromJson(id): id should be a string'));
    return;
  }
  if (typeof(json_path) !== "string") {
    cb(new errors.BadParameters('getInstanceFromJson(json_path): json_path should be a string'));
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
      util.format('getInstanceFromJson(%s): "apps" key is lacking', json_path))
    );
    return;
  }
  var one_app = json.apps.filter(function getOneInstance(app) {
    if (app.name === id) {
      return app;
    }
  });
  var instance = null;
  if (one_app.length) {
    instance = one_app[0];
  }
  cb(null, instance);
};


/**
 * Return true if the instance is present in the PM2 settings
 * @param  {String}   id Identifier of the instance
 * @param  {Function} cb Callback (exists)
 */
module.exports.instanceExists = function (id, cb) {
  var pm2_json_path = module.exports.getJsonPath();
  fs.exists(pm2_json_path, function testFile (file_exists) {
    if (!file_exists) {
      cb(false);
      return;
    }
    module.exports.getInstanceFromJson(id, pm2_json_path,
      function isInstance(err, instance) {
      if (err) {
        cb (false);
        return;
      }
      cb(instance !== null);
    });
  });
};

/**
 * Start an instance which exists in PM2 JSON settings
 * @param  {String}   id Identifier of the instance
 * @param  {Function} cb fn(err, data)
 */
module.exports.startInstanceFromJson = function (id, cb) {
  var pm2_json_path = module.exports.getJsonPath();

  module.exports.getInstanceFromJson(id, pm2_json_path,
    function afterGetInstanceFromJson (err, instance) {
      debug("afterGetInstanceFromJson instance", instance);

      pm2.connect(function afterConnect(err) {
        if (err) {
          pm2.disconnect(function () {
            cb(err);
          });
          return;
        }

        pm2.start(
          instance.script,
          instance,
          function afterStart(err, data) {
            debug('afterStart',err,data);
            if (err) {
              pm2.disconnect(function () {
                cb(err);
              });
              return;
            }
            pm2.disconnect(function () {
              cb(err, data);
            });
        });
      });
    }
  );

};

/**
 * delete an instance of castor managed by PM2
 * @param  {String}   id Identifier of the instance
 * @param  {Function} cb fn(err, proc)
 */
module.exports.deleteInstance = function (id, cb) {
  pm2.connect(function afterConnect(err) {
    if (err) {
      pm2.disconnect(cb);
      return;
    }

    pm2.delete(id, function afterDelete(err, proc) {
      if (err) {
        pm2.disconnect(function() { cb(err); });
        return;
      }
      pm2.disconnect(function () {
        cb(err, proc);
      });

    });
  });
}

/**
 * Restart instances from the PM2 settings (or start)
 * WARNING: maybe not used
 * @param  {Function} cb Callback(err)
 */
module.exports.startOrRestartInstancesFromJson = function (cb) {
  var pm2_json_path = module.exports.getJsonPath();

  pm2.connect(function afterConnect(err) {
    if (err) {
      pm2.disconnect(function () {
        cb(err);
      });
      return;
    }

    pm2._jsonStartOrAction(
      'restart', pm2_json_path, {},
      function afterJsonStartOrRestart(err, data) {
        debug('afterJsonStartOrRestart',err,data);
        if (err) {
          pm2.disconnect(function () {
            cb(err);
          });
          return;
        }
        debug("afterJsonStartOrRestart", data);
        pm2.disconnect(function () {
          cb(err, data);
        });
      });
  });

};
