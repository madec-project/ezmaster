/*jslint node:true, maxlen:150, maxerr:50, indent:2, laxcomma:true, white:true  */
'use strict';

var debug     = require('debug')('castor:admin:processes');
var processes = require('../lib/processes.js');

module.exports = function (server) {

  // TODO: use "return next(err);" when there is an error

  /////////////////////////////////////////////////////////////////////////////
  // DELETE /process/:id
  server.delete('/process/:id', processes.routeDeleteProcess);

  /////////////////////////////////////////////////////////////////////////////
  // PUT /process/:id
  server.put('/process/:id', processes.routePutProcess);

  /////////////////////////////////////////////////////////////////////////////
  // GET /process/list.json
  // server.get('/process/list.json', processes.routeGetList);

  /////////////////////////////////////////////////////////////////////////////
  // GET /process/:id
  // server.get('/process/:id', processes.routeGetProcess);

};
