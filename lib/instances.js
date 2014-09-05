/*jslint node:true, maxlen:100, maxerr:50, indent:2, laxcomma:true, white:true */
'use strict';
// Get the configuration of all instances (from their config files)

var debug     = require('debug')('castor:admin:instances');
var util      = require('util');
var path      = require('path');
var sugar     = require('sugar');
var fs        = require('fs');
var async     = require('async');
var getport   = require('getport');
var filesize  = require('filesize');
var os        = require('os');
var config    = require('../config');
var Errors    = require('./errors');
var processes = require('./processes');

/**
 * Return only the instances that have the user in their users
 * @param  {Object} instances
 * @param  {String} user      Email of the user to compare
 * @return {Object} instances that contains the user
 */
module.exports.getUpdatableInstances = function (instances, user) {
  var updatableInstances = {};
  var instancesId = Object.keys(instances);
  instancesId.forEach(function(instanceId, i) {
    var instance = instances[instanceId];
    var users = instance.users;
    var isConnected = function (admanaloader) {
      return admanaloader && admanaloader.email === user;
    };
    if (users && users.some(isConnected)) {
      updatableInstances[instanceId] = instance;
    }
  });

  return updatableInstances;
};

/**
 * Test the existence of the lock file in dir_path.
 * @param  {String}   dir_path Path of the instance in which the lock file should be
 * @param  {Function} cb       Callback(file_exists, dir_exists)
 */
var existConfigLockFile = function existConfigLockFile(dir_path, cb) {
  fs.exists(dir_path, function checkInstancePath(directory_exists) {
    if (!directory_exists) {
      cb(false, false);
      return;
    }

    var lock_file_path = dir_path + '.json.lock';
    fs.exists(lock_file_path, function checkLockFile(exists) {
      cb(exists, true);
    });
  });

};

/**
 * Remove the .json.lock file in the dir_path.
 * @param  {String}   dir_path Path of the instance in which to remove the lock file
 * @param  {Function} cb       Callback(err)
 */
var removeConfigLockFile = function removeConfigLockFile(dir_path, cb) {
  var lock_file_path = dir_path + '.json.lock';
  fs.exists(lock_file_path, function removeLock(exists) {
    if (exists) {
      fs.unlink(lock_file_path, cb);
    }
  });
};

/**
 * Create the .json.lock file in dir_path
 * @param  {String}   dir_path Path of the instance in which to create the lock file
 * @param  {Function} cb       Callback(err)
 */
var createConfigLockFile = function createConfigLockFile(dir_path, cb) {
  var lock_file_path = dir_path + '.json.lock';
  fs.writeFile(lock_file_path, '', function locked(err) {
    debug("err", err);
    cb(err);
  });
};

/**
 * Remove all the lock files in every instance directory
 * @param  {Function} cb Callback(err)
 */
module.exports.removeConfigLockFiles = function removeConfigLockFiles(cb) {
  var instances_path = path.resolve(__dirname, '..', config.instances_path);
  var instances = fs.readdirSync(instances_path);
  instances.sort();
  var error = null;
  var treatReturn = function treatReturn(err) {
    error = error || err;
  };
  for (var i in instances) {
    var instance = instances[i];
    var instance_path = path.join(instances_path,instance);
    removeConfigLockFile(instance_path, treatReturn);
  }
  cb(error);
};

/**
 * Remove the directory containing the instance configuration
 *
 * @param  {String}   id            Identifier of the instance
 * @param  {String}   connectedUser mail of the connected user (CAS)
 * @param  {Function} cb            Callback(err)
 */
var removeInstance = function removeInstance(id, connectedUser, cb) {
  debug('removeInstance START', id, connectedUser);
  var instance_path_dir = path.resolve(__dirname, '..', config.instances_path, id);
  var config_file_path = instance_path_dir + '.json';
  debug('instance_path_dir', instance_path_dir);
  async.series([
    function checkUser(callback) {
      debug('checkUser', connectedUser);
      if (!connectedUser) {
        callback(new Errors.BadParameters("no connected user !"));
      }
      else {
        callback(null);
      }
    },
    function checkAdmin(callback) {
      debug('checkAdmin');
      var config = getInstanceConfig(id);
      debug('config', config);
      var isDelAdmin = function (uv) {
        return((uv.email === connectedUser) && (uv.role === 'admin'));
      };
      if (config.users.some(isDelAdmin)) {
        callback(null);
      }
      else {
        callback(new Errors.Forbidden("connected user " +
          "has no rights to delete instance !"));
      }
    },
    function removeFiles(callback) {
      debug('removeFiles');
      fs.exists(instance_path_dir, function (exists) {
        if (exists) {
          fs.readdir(instance_path_dir, function (err, files) {
            files.forEach(function (file, index) {
              var file_path = path.join(instance_path_dir, file);
              fs.unlink(file_path, function (err) {
                if (err) {
                  debug(err);
                  callback(err);
                }
              });
            });
            callback(null);
          });
        }
        else {
          callback(null);
        }
      });
    },
    function removeDirectory(callback) {
      debug('removeDirectory');
      fs.rmdir(instance_path_dir, callback);
    },
    function removeConfigFile(callback) {
      debug('removeConfigFile');
      fs.exists(config_file_path, function (exists) {
        if (exists) {
          fs.unlink(config_file_path, callback);
        }
        else {
          callback(null);
        }
      });
    }
  ],
  function (err) {
    debug('- err');
    cb(err);
  });
};

/**
 * Get the configuration of one instance in the directory of instances
 * (admin/usr/share/nodejs/instances/)
 * The name of the directory is the id of the instance.
 *
 * @param  {String} id  Identifier of the instance
 * @return {Object} instance configuration file's content
 */
var getInstanceConfig = function getInstanceConfig(id) {
  var instance_path = path.resolve(__dirname, '..', config.instances_path, id);
  if (fs.existsSync(instance_path + '.json')) {
    var config_path = fs.realpathSync(instance_path + '.json');
    if (require.cache[config_path] !== undefined) {
      delete require.cache[config_path];
    }
    var instance_config = require(config_path);
    return instance_config;
  }
  return null;
};

/**
 * Get the configuration of each instance in the directory of instances
 * (admin/usr/share/nodejs/instances/)
 * Add the name of the directory as the id of the instance.
 *
 * @return {Object} an array of instances, each instance being its
 * configuration file's content
 */
module.exports.getInstancesConfig = function getInstancesConfig () {
  var instances_config = {};
  var instances_path = path.resolve(__dirname, '..', config.instances_path);
  var instances = fs.readdirSync(instances_path);
  instances.sort();
  for (var i in instances) {
    var instance = instances[i];
    if (instance.charAt(0) !== '.') {
      var instance_path = instances_path + '/' + instance;
      if (fs.existsSync(instance_path + '.json')) {
        var config_path = fs.realpathSync(instance_path + '.json');
        if (require.cache[config_path] !== undefined) {
          delete require.cache[config_path];
        }
        var instance_config = require(config_path);
        instance_config.id = instance;
        instances_config[instance] = instance_config;
      }
    }
  }

  return instances_config;
};

/**
 * Write the instance.json file of an instance
 *
 * @param {String}   instance_path  Path of the instance configuration directory (must exist)
 * @param {Object}   configJson     Instance configuration
 * @param {Function} cb             callback(err)
 **/
var writeConfigJson = function writeConfigJson(instance_path, configJson, cb) {
  debug('configJson (tous les cas)', configJson);
  debug('JSON.stringify', JSON.stringify(configJson, null, "   "));
  debug('instance_path', instance_path);
  fs.writeFile(instance_path + '.json', JSON.stringify(configJson, null, "   "), cb);
};

/**
 * Create the instance.json file of an instance
 *
 * Ex:
 * {
 *  "title": "Test castor instance",
 *  "port": 35269,
 *  "accel": "http://instance.domain.co/",
 *  "date": "2013/10/10"
 * }
 *
 * @param {String}   instance_path  Path of the instance directory (must exist)
 * @param {String}   id             identifier of the instance (alphanumeric)
 * @param {String}   title          Title of the instance (human readable)
 * @param {String}   accel          externl URL root of the instance (optional)
 * @param {Object}   users          email & role of users
 * @param {String}   date           instance creation date
 * @param {String}   connectedUser  email of the connected user (CAS)
 * @param {Function} cb    callback(err, config)
 */
var createConfigJson =
  function createConfigJson(instance_path, id, title, accel, users, date, connectedUser, cb) {
  debug('createConfigJson');
  debug('accel', accel);
  if (!id || id === '') {
    cb(new Errors.BadParameters("No id for the instance!"));
    return;
  }
  if (!id.match(/^[a-z_0-9]+$/)) {
    debug('id', id);
    cb(new Errors.BadParameters("Instance id (" + id +  ") must contain only " +
                                     "lowercase letters or integers!"));
    return;
  }
  if (!title || title === '') {
    cb(new Errors.BadParameters("No title for the instance!"));
    return;
  }
  if (accel && !accel.match(
      /(https?):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/)) {
    cb(new Errors.BadParameters("External URL is not well-formed."));
    return;
  }
  if (users) {
    for(var index=0; index < users.length; index++) {
      var user = users[index];
      // email
      if (!user.email) {
        debug('No email');
        cb (new Errors.BadParameters("A user must have an email."));
        return;
      }
      if (typeof(user.email) !== 'string') {
        cb (new Errors.BadParameters("An email should be a string."));
        return;
      }
      if (!user.email.match(/^[a-zA-Z0-9._\-]+@[a-z0-9._\-]{2,}\.[a-z]{2,4}$/)) {
        cb (new Errors.BadParameters("An email is not well-formed."));
        return;
      }
      // role
      if(!user.role)  {
        cb (new Errors.BadParameters("A user must have a role."));
        return;
      }
      if (typeof(user.role) !== 'string') {
        cb (new Errors.BadParameters("A role should be a string."));
        return;
      }
      if (['uploader', 'manager', 'admin'].indexOf(user.role) === -1) {
        cb (new Errors.BadParameters("A role has a bad value."));
        return;
      }
    }
  }

  createConfigLockFile(instance_path, function (err) {
    if (err) {
      return cb(err);
    }
    var configJson = {};
    debug('date', date);
    debug('!date', !date);
    if (!date) {
      var d = new Date();
      var strDate = Date.create().utc(true).format('{yyyy}/{MM}/{dd}');
      configJson.date = strDate;
    }
    else {
      configJson.date = date;
    }
    var uploadPath = path.resolve(config.instances_path, id);
    debug('uploadPath', uploadPath);
    configJson.upload_path = uploadPath;
    debug('configJson', configJson);
    configJson.title = title.escapeHTML();
    var instancesConfigs = module.exports.getInstancesConfig();
    if (users) {
      configJson.users = users;
    }
    if (Object.has(instancesConfigs, id)) {
      debug('instance modification');

      if (!connectedUser.endsWith(config.administrator_end)) {
        cb(new Errors.Forbidden("User " + connectedUser +
          " has no rights to modify an instance"));
        return;
      }
      debug('users',users);
      // at least a manager
      var isAdminOrManager = function(uv) {
        return (uv.email === connectedUser) &&
               (uv.role === "admin" || uv.role === "manager");
      };
      if(!users.some(isAdminOrManager)) {
        cb(new Errors.Forbidden("User " + connectedUser +
          " cannot modify the " + id + " instance"));
        return;
      }

      configJson.port = instancesConfigs[id].port;
      if (accel) {
        configJson.accel = accel;
      }
      writeConfigJson(instance_path, configJson, function returnConfigJson(err) {
        cb(err, configJson);
      });
    }
    else {
      debug('new instance', connectedUser);
      if (!connectedUser.endsWith(config.administrator_end)) {
        cb(new Errors.Forbidden("User " + connectedUser +
          " has no rights to create an instance"));
        return;
      }
      // at least an administrator
      debug('users1', users);
      if (!users) {
        users = [];
      }
      debug('users2', users);
      var isAdmin = function(uv) {return uv.role === "admin";};
      var admins = users.filter(isAdmin);
      if (admins.length === 0) {
        users.push({ email: connectedUser, role: 'admin' });
      }
      debug('users3', users);
      debug('configJson', configJson);
      var max_port = 35268;
      Object.keys(instancesConfigs, function (key, value) {
        max_port = Math.max(max_port, value.port);
      });
      configJson.port = max_port + 1;
      getport(configJson.port, function (err, port) {
        if(err) {
          cb(err);
          return;
        }
        configJson.port = port;
        writeConfigJson(instance_path, configJson, function returnConfigJson(err) {
          cb(err, configJson);
        });
      });
    }
  });
};

/**
 * Compute and return the internal URL of the instance.
 * @param {String}  id  Identifier of the instance
 * @return {String} internal URL of the instance
 */
var getInstanceUrlRoot = function getInstanceUrlRoot(id) {
  var config = getInstanceConfig(id);
  var port = config.port;
  debug('os.networkInterfaces().eth0', os.networkInterfaces().eth0);
  return "http://" + os.networkInterfaces().eth0[0].address + ":" + port + "/";
};

/**
 * Generate (and replace when needed) the instance.json of the instance
 * @param {String}   id             identifier of the instance (alphanumeric)
 * @param {String}   title          Title of the instance (human readable)
 * @param {String}   accel          External URL root of the instance (optional)
 * @param {Object}   users          email & role of users
 * @param {String}   date           instance creation date (2013/10/22)
 * @param {String}   connectedUser  email of the connected user (CAS)
 * @param {Function} cb       callback(err, config)
 */
var setInstanceConfig =
function setInstanceConfig(id, title, accel, users, date, connectedUser, cb) {
  debug('setInstanceConfig START');
  var instance_path = path.join(__dirname, '..', config.instances_path, id);
  debug('instance_path', instance_path);
  existConfigLockFile(instance_path, function createConfig(isLocked, instanceExists) {
    if (isLocked) {
      cb(new Errors.Forbidden(
        'Someone else is modifying the instance at the same time. Try again later.'));
      return;
    }
    if (instanceExists) {
      createConfigJson(instance_path, id, title, accel, users, date, connectedUser, cb);
    }
    else {
      fs.mkdir(instance_path, function createCallBack(err) {
        if (err) {
          return cb(err);
        }
        createConfigJson(instance_path, id, title, accel, users, date, connectedUser, cb);
      });
    }
  });
};

/**
 * Return the data size of the instance (in its upload directory)
 * @param {Integer} id    Instance identifier
 * @param {Function} cb   Callback(err, { size: '2.3Mo'});
 */
var getInstanceVolume = function getInstanceVolume(id, cb) {
  var instance_config = getInstanceConfig(id);
  var upload_path = path.resolve(__dirname, '..', config.instances_path, id);
  fs.exists(upload_path, function (exists) {
    if (!exists) {
      return cb (null, { size: '0 byte'}); // TODO: translate
    }
    fs.readdir(upload_path, function dirfiles(err, files) {
      if (err) {
        return cb(err);
      }
      var addSize = function addSize(sum, file) {
        var file_path = path.join(upload_path, file);
        var stats = fs.statSync(file_path);
        if (stats && stats.isFile()) {
          return sum  + stats.size;
        }
        else {
          return sum;
        }
      };
      var size = files.reduce(addSize, 0);
      var result = { size: filesize(size, {base: 2}) };
      cb(null, result);
    });

  });
};

/**
 * Parse appendGrid input values
 * @param {Object} users  HTTP body containing an array of  {email, role, RecordId}
 * @return {Object}
 */
var parseAppendGrid = function parseAppendGrid (users) {
  debug('parseAppendGrid START');
  debug('users', users);
  if (users) {
    users.forEach(function (user, index) {
      delete user.RecordId;
    });
  }
  else {
    users = [];
    debug('No users in instance!');
  }
  return users;
};

/**
 * Create an instance record
 * @param  {Request}    req  request (with a title, technicalName, and users)
 * @param  {Response}   res  response to send
 * @param  {Function}   next Call the next Express's middleware in case of error
 */
module.exports.postRecord = function postRecord(req, res, next) {
  debug('postRecord START');
  if(!req.user) {
    req.user = "admin@castorjs.org";
  }

  var title = req.body.title;
  var technicalName = req.body.technicalName;
  var date = req.body.date;
  debug('body', req.body);
  var accel = req.body.accel;
  var users = parseAppendGrid(req.body.tblAppendGrid);
  
  debug('technicalName', technicalName);
  // lock by checking / creating .json.lock
  if (!technicalName || technicalName === '') {
    next(new Errors.BadParameters("No id for the instance!"));
    return;
  }
  if (!technicalName.match(/^[a-z_0-9]+$/)) {
    debug('technicalName', technicalName);
    return next(new Errors.BadParameters("Instance id (" + technicalName +
                                          ") must contain only " +
                                          "lowercase letters or integers!"));
  }

  var connectedUser = req.user;
  debug('connectedUser', connectedUser);

  setInstanceConfig(technicalName, title, accel, users, date, connectedUser,
                    function afterSetInstanceConfig(err1, instance_config) {
    debug("postRecord err1", err1);
    if (err1) {
      return next(err1);
    }

    // Remove .json.lock
    var instance_path = path.resolve(__dirname, '..', config.instances_path, technicalName);
    var lock_file_path = instance_path + '.json.lock';
    fs.exists(lock_file_path, function (exists) {
      if (!exists) {
        debug('File',lock_file_path,'does not exist');
        res.send(201);
        return;
      }
      fs.unlink(lock_file_path, function unlocked(err) {
        if (err) {
          debug('unlocking',err);
          return next(err);
        }

        if(err1) {
          debug("postRecord:",err1);
          return next(err1);
        }

        debug('unlock done');

        var pm2_settings_path = processes.getJsonPath();
        processes.addInstanceToJson(
          technicalName, instance_config.port , pm2_settings_path,
          function afterAddInstanceToJson (err2, pm2_instance) {
            debug('instance ' + technicalName + ' added to ' + pm2_settings_path);
        
            // start the instance
            processes.startInstanceFromJson(technicalName,
              function afterStartInstanceFromJson(err, data) {
                if (err) {
                  debug('afterStartInstanceFromJson err', err);
                  return next(err);
                }
                debug('afterStartInstanceFromJson data', data);
                res.send(201);
              }
            );
          }
        );

      });
    });
  });
};

/**
 * Return an instance record
 * @param  {Request}    req  request (with a param.id)
 * @param  {Response}   res  response to send
 * @param  {Function}   next Call the next Express's middleware in case of error
 */
module.exports.getRecord = function getRecord(req, res, next) {
  debug(util.inspect(req.params));
  var configJson = getInstanceConfig(req.params.id);
  if (configJson) {
    configJson.url_root = getInstanceUrlRoot(req.params.id);
    res.send(configJson);
  }
  else {
    next(new Errors.NotFound("Instance not found"));
  }
};

/**
 * Return the instances list
 * @param  {Request}    req  request
 * @param  {Response}   res  response to send
 * @param  {Function}   next Call the next Express's middleware in case of error
 */
module.exports.getList = function getList(req, res, next) {
  debug("instances.getList");
  debug("updatable",req.param('updatable'));
  if (!req.user) { // Let's cheat a bit
    req.user = "admin@castorjs.org";
  }
  var instancesList = module.exports.getInstancesConfig();
  if (instancesList) {
    if (req.param('updatable')) {
      instancesList = module.exports.getUpdatableInstances(instancesList, req.user);
    }
    res.send(instancesList);
  }
  else {
    next(new Errors.NotFound("No instance found"));
  }
};

/**
 * Delete the instance
 * @param  {Request}    req  request (with a param.id)
 * @param  {Response}   res  response to send
 * @param  {Function}   next Call the next Express's middleware in case of error
 */
module.exports.deleteRecord = function deleteRecord(req, res, next) {
  debug('deleteRecord');
  if (!req.user) {
    req.user = "admin@castorjs.org";
  }
  if (!req.params.id) {
    next(new Errors.BadParameters("No id for the instance!"));
    return;
  }
  removeInstance(req.params.id, req.user, function (err) {
    if (err) {
      debug(err);
      next(err);
      return;
    }
    debug('instance removed');
    processes.deleteInstanceFromJson(
      req.params.id,
      processes.getJsonPath(),
      function afterDeleteInstanceFromJson(err) {
        if (err) {
          debug(err);
          next(err);
          return;
        }
        // TODO: stop instance from pm2
        debug('instance ' + req.params.id + ' removed from pm2 settings');
        res.send();
      }
    );
  });
};

/**
 * Return the volume of data of the instance
 * @param  {Request}    req  request (with a param.id)
 * @param  {Response}   res  response to send
 * @param  {Function}   next Call the next Express's middleware in case of error
 */
module.exports.getVolume = function getVol (req, res, next) {
  debug("getVolume");
  if (!req.params.id) {
    next(new Errors.BadParameters("No id for the instance!"));
    return;
  }
  getInstanceVolume(req.params.id, function (err, volume) {
    if (err) {
      next(err);
      return;
    }
    if (volume) {
      res.send(volume);
    }
    else {
      next(new Errors.NotFound("Instance " + req.params.id + " not found!"));
    }
  });
};
