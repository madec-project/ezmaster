/*jslint node:true, maxlen:100, maxerr:50, indent:2, laxcomma:true, white:true */
"use strict";

// Session files library

var debug = require('debug')('castor:admin:session');

// Required libraries
var fs = require('fs');
var async = require('async');
var path = require('path');

var sessionPath = path.resolve(__dirname, '../tmp');
/**
 * Clean the session directory
 * @param  {RegExp} regexp select the filenames of the file to remove
 * @param  {Function} cb Callback which parameter is an error.
 */
module.exports.cleanSessionDir = function cleanSessionDir(regexp, cb)  {
  regexp = regexp ? regexp : /\.(csv|json)$/;

  fs.readdir(sessionPath, function (err, files) {
    if (err) {
      cb(err);
      return;
    }

    var isJsonOrCsv = function isJsonOrCsv(filename) {
      return filename.search(regexp) !== -1;
    };

    files = files.filter(isJsonOrCsv);

    async.every(
      files,
      function removeFile(file, callback) {
        debug('cleanSessionDir / removeFile', file);
        fs.unlink(sessionPath + '/' + file, function (err) {
          callback(err ? false : true);
        });
      },
      function (result) {
        cb (result?null:new Error("All files have not been removed in " + sessionPath));
      });
  });

};
