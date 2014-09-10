/*jslint node:true, maxlen:100, maxerr:50, indent:2, laxcomma:true, white:true */
/*global describe:true, it:true, before:true, beforeEach:true */
"use strict";

// Tests for upload

// Required libraries
var debug      = require('debug')('castor:admin:upload:test');
var assert     = require('assert');
var fs         = require('fs');
var path       = require('path');
var request    = require('request');
var isSameFile = require('./helpers/is-same-file');
var config     = require('../config');

// Files to use
var noticesFilePath = 'test/dataset/12_10_notices_instance_test.5.rdf';
var expectedFilePath = noticesFilePath;
var copiedFilePath = path.resolve(__dirname, '..', 'instances',
  'test/12_10_notices_instance_test.5.rdf');
var originalTestInstancePath = 'test/dataset/instances/test';
var originalTestInstanceConfigPath = originalTestInstancePath + '.json';
var testInstancePath = path.resolve(__dirname, '..', 'instances', 'test');
var testInstanceConfigPath = testInstancePath + '.json';

// Let's test
describe('Upload', function () {

  before(function (done) {
    fs.unlink(testInstanceConfigPath, function (err) {
      if (err) {
        if (err.code !== 'ENOENT')  {
          done(err);
          return;
        }
      }
      fs.rmdir(testInstancePath, function (err) {
        if (err) {
          if (err.code !== 'ENOENT')  {
            done(err);
            return;
          }
        }
        fs.mkdir(testInstancePath, function (err) {
          if (err) {
            done(err);
            return;
          }
          fs.link(originalTestInstanceConfigPath, testInstanceConfigPath, function (err) {
            done(err);
          });
        });
      });
    });
  });

  describe('GET', function () {

    it('should return a 200 status code', function (done) {
      request('http://localhost:' + config.port + '/upload?disablecas=true',
              function (err, response, body) {
        assert(!err, 'No error yield');
        assert.equal(response.statusCode, 200, 'return a 200 status code');
        done();
      });
    });

    it('should have the upload form', function (done) {
      request('http://localhost:' + config.port + '/upload?disablecas=true',
              function (err, response, body) {
        assert(body.search("Data file") != -1, 'contains "Data file"');
        assert(body.search("<form ") != -1, 'contains a form');
        assert(
          body.search('<input type="file" name="notices" id="notices" required') != -1,
          'contains input#notices'
        );
        done();
      });
    });

  });

  describe('POST', function () {

    beforeEach(function (done) {
      fs.exists(copiedFilePath, function (exists) {
        if (exists) {
          fs.unlink(copiedFilePath, done);
        }
        else {
          done();
        }
      });
    });

    describe('notices + affiliations', function () {

      it('should not be a generated file before', function () {
        assert.equal(fs.existsSync(copiedFilePath), false);
      });

      it('should generate the file', function (done) {
        debug('noticesFilePath',noticesFilePath);
        debug('copiedFilePath',copiedFilePath);
        var r = request.post('http://localhost:' + config.port + '/upload' +
                             '?disablecas=true',
                              function (err, response, body) {
          assert(!err, 'No error reported');
          debug('upload response.statusCode', response.statusCode);
          assert.equal(response.statusCode, 302, 'User redirected to /upload');
          assert(fs.existsSync(copiedFilePath),
            'File ' + copiedFilePath + ' has been generated');

          debug('expectedFilePath', expectedFilePath);
          // check that the content of the file is the same as the expected one
          isSameFile(copiedFilePath, expectedFilePath, function (err, res) {
            assert(res, 'The generated file is the same as the expected file');
            done();
          });
        });
        var form = r.form();
        form.append('instance', 'test');
        form.append('notices', fs.createReadStream(noticesFilePath));
      });

      it('should check the presence of an instance name in the form', function (done) {
        assert.equal(fs.existsSync(copiedFilePath), false);
        var r = request.post('http://localhost:' + config.port + '/upload' +
                              '?disablecas=true',
                              function (err, response, body) {
          assert(!fs.existsSync(copiedFilePath),
            'File ' + copiedFilePath + 'has not been generated');
          done();
        });
        var form = r.form();
        form.append('notices', fs.createReadStream(noticesFilePath));
      });

    });

  });

});