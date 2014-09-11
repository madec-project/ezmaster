/*jslint node:true, maxlen:150, maxerr:50, indent:2, laxcomma:true, white:true  */
'use strict';

var config = require('../config');
var instances = require('../lib/instances.js');
var debug = require('debug')('castor:admin:instance');

// var cas = require('../middleware/casauth.js');


module.exports = function (server) {

  // TODO: use "return next(err);" when there is an error

  /////////////////////////////////////////////////////////////////////////////
  // POST /instance/
  server.post('/instance/'/*, cas.casauth({root: config.cas_server})*/, instances.postRecord);

  /////////////////////////////////////////////////////////////////////////////
  // GET /instance/list.json
  server.get('/instance/list.json'/*, cas.casauth({root: config.cas_server})*/, instances.getList);

  /////////////////////////////////////////////////////////////////////////////
  // GET /instance/:id
  server.get('/instance/:id'/*, cas.casauth({root: config.cas_server})*/, instances.getRecord);

  /////////////////////////////////////////////////////////////////////////////
  // put /instance/:id
  server.put('/instance/:id', instances.routePutRecord);

  /////////////////////////////////////////////////////////////////////////////
  // GET /instance/:id/volume.json
  server.get('/instance/:id/volume.json'/*, cas.casauth({root: config.cas_server})*/, instances.getVolume);

  /////////////////////////////////////////////////////////////////////////////
  // DELETE /instance/:id
  server.delete('/instance/:id'/*, cas.casauth({root: config.cas_server})*/, instances.deleteRecord);

};

