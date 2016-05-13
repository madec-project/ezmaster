/*jshint node:true*/
'use strict';

var debug         = require('debug')('castor:admin:processes');
var util          = require('util');
var fs            = require('fs');
var path          = require('path');
var child_process = require('child_process');
var errors        = require('./errors');
var instances     = require('./instances');
var config        = require('../config');

/**
 * Load a JSON file and returns its content.
 *
 * Does not cache the file, whereas raw require does.
 *
 * @param  {String} json_path Path of the JSON file
 * @return {Object|Array}     Content of the JSON file
 */
var loadJson = module.exports.loadJson = function(json_path) {
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
module.exports.addInstanceToJson = function addInstanceToJson(id, port, json_path, cb) {
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

  // var cwd = path.resolve(__dirname, '..');
  var json = loadJson(json_path);
  var instances_path = config.instances_path;
  var instance_path = path.join(instances_path, id);
  var jsonInstance = loadJson(instance_path+'.json');
  var app_path = path.resolve(process.env.HOME, 'apps', jsonInstance.app);

  var script = jsonInstance.app ?
               path.resolve(app_path , 'cli') :
               path.resolve(__dirname, '..', '..', 'castor-cli', 'bin',"castor");


  var instance = {
    name:             id,
    cwd:              app_path,
    args:             util.format("[\"%s\"]", instance_path),
    script:           script,
    node_args:        [],
    exec_mode:        "fork_mode",
    exec_interpreter: "node",
    // watch:            util.format("%s.json", id),
    env:              {
                        "NODE_ENV": process.env.NODE_ENV || "production"
                      },
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
 * @param {Function} cb      fn(err, configuration)
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
  var f = path.resolve(__dirname, '..', config.instances_path + ".json");
  if (!fs.existsSync(f)) {
    var json = {
      apps: [
      // {
      //   name:             "admin",
      //   script:           "admin",
      //   cwd:              path.resolve(__dirname, '..', 'bin'),
      //   node_args:        [],
      //   exec_mode:        "fork_mode",
      //   exec_interpreter: "node"
      // }
      ]
    };
    fs.writeFileSync(f, JSON.stringify(json, null, '  '));
  }
  return f;
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
    cb(new errors.BadParameters('getInstanceFromJson(json_path): json_path should be a string (' + json_path + ')'));
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
 * @param  {Function} cb fn(err)
 */
module.exports.startInstanceFromJson = function (id, cb) {
  var pm2_json_path = module.exports.getJsonPath();

  module.exports.getInstanceFromJson(id, pm2_json_path,
    function afterGetInstanceFromJson (err, instance) {
      debug("afterGetInstanceFromJson instance", instance);
      if (!instance) {
        cb(new errors.NotFound('Instance ' + id + ' was not found in ' + pm2_json_path));
        return;
      }

      var tmp_pm2_json_path = '/tmp/' + id + '-pm2.json';
      fs.writeFileSync(tmp_pm2_json_path, JSON.stringify(instance));
      child_process.exec('pm2 start ' + tmp_pm2_json_path, function (err, stdout, stderr) {
        if(err) {
          cb(err);
          return;
        }
        fs.unlink(tmp_pm2_json_path, function (err) {
          cb(err);
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

  child_process.exec('pm2 delete ' + id, function (err, stdout, stderr) {
    cb(err);
  });

};


/**
 * Restart one instance (id)
 * @param  {String}   id Identifier of the instance
 * @param  {Function} cb fn(err)
 */
module.exports.restart = function restart (id, cb) {

  child_process.exec('pm2 restart ' + id, function (err, stdout, stderr) {
    cb(err);
  });

};

/**
 * Delete the process from JSON and PM2
 * @param  {Request}    req  request (with a param.id)
 * @param  {Response}   res  response to send
 * @param  {Function}   next Call the next Express's middleware in case of error
 */
module.exports.routeDeleteProcess = function (req, res, next) {
  var pm2_json_path = module.exports.getJsonPath();
  module.exports.deleteInstanceFromJson(
    req.params.id,
    pm2_json_path,
    function afterDeleteInstanceFromJson(err, config) {
      if (err) {
        debug(err);
        next(err);
        return;
      }
      module.exports.deleteInstance(
        req.params.id,
        function afterDeleteInstance(err, proc) {
          if (err) {
            debug(err);
            next(err);
            return;
          }
          res.send();
        }
      );
    }
  );
};

/**
 * Create a process in PM2 JSON settings and start it.
 * @param  {Request}  req   request (with params.id)
 * @param  {Response} res   response to send
 * @param  {Function} next  Call the next Express's middleware in case of error
 */
module.exports.routePutProcess = function (req, res, next) {
  var pm2_settings_path = module.exports.getJsonPath();
  var technicalName     = req.params.id;
  var instance_config   = instances.getInstanceConfig(technicalName);

  module.exports.addInstanceToJson(
    technicalName, instance_config.port , pm2_settings_path,
    function afterAddInstanceToJson (err2, pm2_instance) {
      debug('instance ' + technicalName + ' added to ' + pm2_settings_path);

      // start the instance
      module.exports.startInstanceFromJson(technicalName,
        function afterStartInstanceFromJson(err, data) {
          if (err) {
            debug('afterStartInstanceFromJson err', err);
            return next(err);
          }
          // debug('afterStartInstanceFromJson data', data);
          res.send(201);
        }
      );
    }
  );
};
