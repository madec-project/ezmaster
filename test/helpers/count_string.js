/*jslint node:true, maxlen:100, maxerr:50, indent:2, laxcomma:true, white:true */
/*global describe:true, it:true, before:true, beforeEach:true */
"use strict";

/**
 * Count the occurrences of string2 in string1
 * @param {string} string1
 * @param {string} string2
 * @return {Number} number of times string2 appears in string1
 */
var countString = function countString (string1, string2) {
  var len = string2.length;
  var count = 0;
  var i = string1.indexOf(string2);
  while (i !== -1) {
    count ++;
    i = string1.indexOf(string2, i+len);
  }
  return count;
};

module.exports = countString;