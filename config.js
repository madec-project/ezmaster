/*jshint node:true*/
'use strict';
var path = require('path');

function Configuration() {
    this.port              =  process.env.PORT || 35267;
    this.instances_path    = path.resolve(process.env.HOME || process.cwd(), "instances");
    this.administrator_end =  "castorjs.org";
    this.theme             = process.env.THEME || 'default';
    this.itemsPerPage      = process.env.ITEMS_PER_PAGE || 30;
    this.domain            = process.env.domainProxy;
}

Configuration.prototype.set = function set(name, value) {
  this[name] = value;
  return this;
};

Configuration.prototype.get = function get(name) {
  return this[name] ? this[name] : undefined;
};


module.exports = new Configuration();
