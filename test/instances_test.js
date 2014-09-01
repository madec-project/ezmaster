/*jslint node:true, maxlen:100, maxerr:50, indent:2, laxcomma:true, white:true */
/*global describe:true, it:true, before:true, beforeEach:true, afterEach:true */
"use strict";

// Tests for instances

// Required libraries
var sugar = require('sugar');
var assert = require('assert');
var util = require('util');
var fs = require('fs');
var path = require('path');
var request = require('request');
var config = require('../config');
var isSameFile = require('./helpers/is-same-file');
var debug = require('debug')('castor:admin:instance-test');

/**
 * Remove the file .json.lock in the dir directory
 * @param  {String}   dir directory path of the instance
 * @param  {Function} cb  callback (err)
 */
var removeLock = function removeLock(dir, cb) {
  fs.exists(dir, function (dir_exists) {
    if (dir_exists) {
      var file_path = path.resolve(dir) + ".json.lock";
      fs.exists(file_path, function (file_exists) {
        if (file_exists) {
          fs.unlink(file_path, function (err) {
            if (err) {
              debug(err);
              cb(err);
            }
            else {
              cb();
            }
          });
        }
        else {
          cb ();
        }
      });
    }
    else {
      cb();
    }
  });
};

// Let's test
describe('Instances', function () {

  before(function (done) {
    // remove testesttest dir (and its files)
    var instance_path_dir = '../instances/testtesttest';
    fs.exists(instance_path_dir, function (exists) {
      if (exists) {
        fs.readdir(instance_path_dir, function (err, files) {
          files.forEach(function (file, index) {
            var file_path = path.join(instance_path_dir, file);
            fs.unlink(file_path, function (err) {
              if (err) {
                debug(err);
                done(err);
              }
            });
          });
          fs.mkdir(instance_path_dir, done);
        });
      }
      else {
        done();
      }
    });
  });

  afterEach(function(done) {
    removeLock('instances/testtesttest', function (err) {
      done(err);
    });
  });

  describe('POST /instance/', function () {

    describe('to create a new instance', function () {

      // Only usable when authentication is implemented
      it.skip('should require a connected user', function (done) {
        var r = request({
          url: 'http://localhost:' + config.port + '/instance/?disablecas=true',
          method: 'POST'
        }, function (err, response, body) {
          assert.equal(response.statusCode, 403);
          done(err);
        });
        var form = r.form();
        form.append('title', 'Instance to test instances (201)');
        form.append('technicalName', 'testtesttest');
        form.append('tblAppendGrid[0][email]', 'chuck@nor.ris');
        form.append('tblAppendGrid[0][role]', 'uploader');
      });

      // Works only when authentication is implemented
      it.skip('should forbid creation to non-castorjs.org users', function (done) {
        var r = request({
          url: 'http://localhost:' + config.port + '/instance/?disablecas=true' +
                                                               '&user=creator@cnrs.fr',
          method: 'POST'
        }, function (err, response, body) {
          assert.equal(response.statusCode, 403);
          done(err);
        });
        var form = r.form();
        form.append('title', 'Instance pour tester les fiches d instances (201)');
        form.append('technicalName', 'testtesttest');
        form.append('tblAppendGrid[0][email]', 'chuck@nor.ris');
        form.append('tblAppendGrid[0][role]', 'uploader');
      });

      it('should get a 201 status code', function (done) {
        var r = request({
          url: 'http://localhost:' + config.port + '/instance/?disablecas=true' +
                                                               '&user=creator@castorjs.org',
          method: 'POST'
        }, function (err, response, body) {
          assert.equal(response.statusCode, 201);
          done(err);
        });
        var form = r.form();
        form.append('title', 'Instance pour tester les fiches d instances (201)');
        form.append('technicalName', 'testtesttest');
        form.append('tblAppendGrid[0][email]', 'chuck@nor.ris');
        form.append('tblAppendGrid[0][role]', 'uploader');
      });

      it('should create a directory and a file within', function (done) {
        fs.exists('instances/testtesttest.json', function (exists) {
          assert(exists);
          done();
        });
      });

      it('should have the information', function () {
        var instance_conf = require('../instances/testtesttest.json');
        debug('instance_conf', util.inspect(instance_conf,true));
        assert.equal(instance_conf.title, 'Instance pour tester les fiches d instances (201)');
        assert(instance_conf.upload_path.endsWith(
          '/instances/testtesttest'));
        assert.equal(instance_conf.users[0].email, 'chuck@nor.ris');
        assert.equal(instance_conf.users[0].role, 'uploader');
      });

      it('should validate the presence of an id', function (done) {
        var r = request({
          url: 'http://localhost:' + config.port + '/instance/?disablecas=true',
          method: 'POST'
        }, function (err, response, body) {
          assert.equal(response.statusCode, 400);
          done(err);
        });
        var form = r.form();
        form.append('title', 'Instance pour tester les fiches d instances (présence id)');
      });

      it('should validate the content of the id', function (done) {
        var r = request({
          url: 'http://localhost:' + config.port + '/instance/?disablecas=true',
          method: 'POST'
        }, function (err, response, body) {
          assert.equal(response.statusCode, 400);
          done(err);
        });
        var form = r.form();
        form.append('title', 'Instance pour tester les fiches d instances (contenu id)');
        form.append('technicalName', 'TestTestTest');
      });

      it('should validate the presence of a title', function (done) {
        var r = request({
          url: 'http://localhost:' + config.port + '/instance/?disablecas=true',
          method: 'POST'
        }, function (err, response, body) {
          assert.equal(response.statusCode, 400);
          done(err);
        });
        var form = r.form();
        form.append('technicalName', 'testtesttest');
      });

      it('should validate the content of the URL', function(done) {
        var r = request({
          url: 'http://localhost:' + config.port + '/instance/?disablecas=true',
          method: 'POST'
        }, function (err, response, body) {
          if (err) {
            debug('validate URL', err);
            done(err);
          }
          assert.equal(response.statusCode, 400);
          done();
        });
        var form = r.form();
        form.append('title', 'Instance pour tester les fiches d instances (URL valide)');
        form.append('technicalName', 'testtesttest');
        form.append('accel', 'anything');
      });

      it('should have users with email', function (done) {
        var r = request({
          url: 'http://localhost:' + config.port + '/instance/?disablecas=true',
          method: 'POST'
        }, function (err, response, body) {
          assert.equal(response.statusCode, 400);
          done(err);
        });
        var form = r.form();
        form.append('title', 'Instance pour tester les fiches d instances (users + emails)');
        form.append('technicalName', 'testtesttest');
        // form.append('tblAppendGrid[0][email]', 'chuck@nor.ris');
        form.append('tblAppendGrid[0][role]', 'uploader');
      });

      it('should have users with well-formed email', function (done) {
        var r = request({
          url: 'http://localhost:' + config.port + '/instance/?disablecas=true',
          method: 'POST'
        }, function (err, response, body) {
          assert.equal(response.statusCode, 400);
          done(err);
        });
        var form = r.form();
        form.append('title', 'Instance pour tester les fiches d instances (email valide)');
        form.append('technicalName', 'testtesttest');
        form.append('tblAppendGrid[0][email]', 'Chuck@Nor.Ris'); // uppercase!
        form.append('tblAppendGrid[0][role]', 'uploader');
      });

      it('should have users with at least one role', function (done) {
        var r = request({
          url: 'http://localhost:' + config.port + '/instance/?disablecas=true',
          method: 'POST'
        }, function (err, response, body) {
          assert.equal(response.statusCode, 400);
          done(err);
        });
        var form = r.form();
        form.append('title', 'Instance pour tester les fiches d instances (1+ roles)');
        form.append('technicalName', 'testtesttest');
        form.append('tblAppendGrid[0][email]', 'chuck@nor.ris'); // uppercase!
        // form.append('tblAppendGrid[0][role]', 'uploader');
      });

      it('should have users with known role', function (done) {
        var r = request({
          url: 'http://localhost:' + config.port + '/instance/?disablecas=true',
          method: 'POST'
        }, function (err, response, body) {
          assert.equal(response.statusCode, 400);
          done(err);
        });
        var form = r.form();
        form.append('title', 'Instance pour tester les fiches d instances (users/role)');
        form.append('technicalName', 'testtesttest');
        form.append('tblAppendGrid[0][email]', 'chuck@nor.ris');
        form.append('tblAppendGrid[0][role]', 'god');
      });

      it('should accept url_root', function (done) {
        var r = request({
          url: 'http://localhost:' + config.port + '/instance/?disablecas=true' +
               '&user=admin@castorjs.org',
          method: 'POST'
        }, function (err, response, body) {
          console.log(body);
          assert(!err);
          assert.equal(response.statusCode, 201);
          done(err);
        });
        var form = r.form();
        form.append('title', 'Instance pour tester les fiches d instances (url)');
        form.append('technicalName', 'testtesttest');
        form.append('url_root', 'http://castor.domain.co:35000');
        form.append('tblAppendGrid[0][email]', 'chuck@nor.ris');
        form.append('tblAppendGrid[0][role]', 'uploader');
        form.append('tblAppendGrid[1][email]', 'admin@castorjs.org');
        form.append('tblAppendGrid[1][role]', 'admin');
      });

      it('should forbid when lock file exists', function (done) {
        var lockFilePath = path.resolve(__dirname, '../instances/testtesttest') + '.json.lock';
        fs.writeFile(lockFilePath, '', function locked(err) {
          assert(!err);

          var r = request({
            url: 'http://localhost:' + config.port + '/instance/?disablecas=true' +
               '&user=admin@castorjs.org',
            method: 'POST'
          }, function (err, response, body) {
            assert.equal(response.statusCode, 403);
            fs.unlink(lockFilePath, done);
            
          });
          var form = r.form();
          form.append('title', 'Instance pour tester les fiches d instances (201)');
          form.append('technicalName', 'testtesttest');
          form.append('tblAppendGrid[0][email]', 'chuck@nor.ris');
          form.append('tblAppendGrid[0][role]', 'uploader');
        });
      });

    });

  });

  describe('GET /instance/:id', function () {

    it('should get the last created instance (testtesttest)', function (done) {
      var r = request('http://localhost:' + config.port + '/instance/testtesttest' +
                      '?disablecas=true&user=admin@castorjs.org',
      function (err, response, body) {
        assert(!err);
        debug('response.statusCode',response.statusCode);
        debug('body', body);
        assert.equal(response.statusCode, 200);
        var conf = JSON.parse(body);
        assert.equal(conf.title, "Instance pour tester les fiches d instances (url)");
        assert.deepEqual(conf.users[0], {
          "email": "chuck@nor.ris",
          "role": "uploader"
        });
        assert(conf.upload_path.endsWith("instances/testtesttest"));
        assert(conf.port >= 35000);
        done(err);
      });
    });

    it('should return a 404 error when getting an unexisting instance', function (done) {
      var r = request('http://localhost:' + config.port +
        '/instance/unexistinginstance?disablecas=true&user=admin@castorjs.org',
      function (err, response, body) {
        assert(!err);
        assert.equal(response.statusCode, 404);
        done(err);
      });
    });

  });

  describe('GET /instance/list.json', function () {

    it('should return at least one instance', function (done) {
      var r = request('http://localhost:' + config.port + '/instance/list.json' +
                      '?disablecas=true',
      function (err, response, body) {
        assert(!err);
        assert.equal(response.statusCode, 200);
        assert(typeof body, "string");
        var list = JSON.parse(body);
        assert(list.hasOwnProperty('testtesttest'));
        done(err);
      });
    });

  });

  describe('POST /instance/ (modify)', function () {

    // Should work when authentication is implemented
    it.skip('should get a 403 status code with inappropriate user', function (done) {
      var r = request({
        url: 'http://localhost:' + config.port + '/instance/?disablecas=true' +
                                                             '&user=nimp@castorjs.org',
        method: 'POST'
      }, function (err, response, body) {
        assert.equal(response.statusCode, 403);
        done();
      });
      var form = r.form();
      form.append('title', 'Instance pour tester les fiches d instances (201)');
      form.append('technicalName', 'testtesttest');
      form.append('tblAppendGrid[0][email]', 'chuck@nor.ris');
      form.append('tblAppendGrid[0][role]', 'uploader');
      form.append('tblAppendGrid[1][email]', 'admin@castorjs.org');
      form.append('tblAppendGrid[1][role]', 'admin');
      form.append('tblAppendGrid[2][email]', 'manager@castorjs.org');
      form.append('tblAppendGrid[2][role]', 'manager');
    });

    it('should get a 201 status code with an admin', function (done) {
      var r = request({
        url: 'http://localhost:' + config.port + '/instance/?disablecas=true' +
                                                             '&user=admin@castorjs.org',
        method: 'POST'
      }, function (err, response, body) {
        assert.equal(response.statusCode, 201);
        done(err);
      });
      var form = r.form();
      form.append('title', 'Instance pour tester les fiches d instances (201)');
      form.append('technicalName', 'testtesttest');
      form.append('tblAppendGrid[0][email]', 'chuck@nor.ris');
      form.append('tblAppendGrid[0][role]', 'uploader');
      form.append('tblAppendGrid[1][email]', 'admin@castorjs.org');
      form.append('tblAppendGrid[1][role]', 'admin');
      form.append('tblAppendGrid[2][email]', 'manager@castorjs.org');
      form.append('tblAppendGrid[2][role]', 'manager');

    });

    it('should have the information', function (done) {
      var configFilePath = path.resolve(__dirname, '../instances/testtesttest') + '.json';
      if (require.cache[configFilePath] !== undefined) {
        delete require.cache[configFilePath];
      }
      var instance_conf = require('../instances/testtesttest.json');
      assert.equal(instance_conf.title, 'Instance pour tester les fiches d instances (201)');
      assert(instance_conf.port >= 35000);
      assert(instance_conf.upload_path.endsWith(
        '/instances/testtesttest'));
      assert.equal(instance_conf.users[2].email, 'manager@castorjs.org');
      assert.equal(instance_conf.users[2].role, 'manager');
      done();
    });

    it('should get a 201 status code with a manager', function (done) {
      var r = request({
        url: 'http://localhost:' + config.port + '/instance/?disablecas=true' +
                                                             '&user=manager@castorjs.org',
        method: 'POST'
      }, function (err, response, body) {
        assert.equal(response.statusCode, 201);
        done(err);
      });
      var form = r.form();
      form.append('title', 'Instance pour tester les fiches d instances (201)');
      form.append('technicalName', 'testtesttest');
      form.append('tblAppendGrid[0][email]', 'steven@seag.al');
      form.append('tblAppendGrid[0][role]', 'uploader');
      form.append('tblAppendGrid[1][email]', 'admin@castorjs.org');
      form.append('tblAppendGrid[1][role]', 'admin');
      form.append('tblAppendGrid[2][email]', 'manager@castorjs.org');
      form.append('tblAppendGrid[2][role]', 'manager');

    });

  });

  describe('DELETE /instance/:id', function () {

    it('should return 200', function (done) {
      var r = request({
        url: 'http://localhost:' + config.port + '/instance/testtesttest' +
             '?disablecas=true&user=admin@castorjs.org',
        method: 'DELETE'
      }, function (err, response, body) {
        assert.equal(response.statusCode, 200);
        done(err);
      });
    });

    it('should have deleted testtesttest', function (done) {
      var r = request('http://localhost:' + config.port + '/instance/list.json' +
                      '?disablecas=true',
      function (err, response, body) {
        assert(!err);
        assert.equal(response.statusCode, 200);
        assert(typeof body, "string");
        var list = JSON.parse(body);
        assert.equal(list.hasOwnProperty('testtesttest'), false);
        done(err);
      });
    });

  });

});
