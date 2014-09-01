/*jslint node:true, maxlen:100, maxerr:50, indent:2, laxcomma:true, white:true */
/*global describe:true, it:true, before:true, beforeEach:true */
"use strict";

var fs = require('fs');

/**
 * Compare a file with another one.
 * @param {string} file1 path of file1
 * @param {string} file2 path of file2
 * @param {function} cb (err, result), where result is a boolean
 */
var isSameFile = function (file1, file2, cb) {
  fs.readFile(file1, 'utf8', function (err, content1) {
    if (err) { cb(err, false); }
    fs.readFile(file2, 'utf8', function (err, content2) {
      if (err) { cb(err, false); }
      cb(null, content1 === content2);
    });
  });
};

module.exports = isSameFile;