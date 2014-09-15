/*jslint node: true, maxlen: 100, maxerr: 50, indent: 2, laxcomma: true */
'use strict';

/**
 * Module dependencies.
 */

var debug                 = require('debug')('castor:admin:app');
var express               = require('express');
var flash                 = require('connect-flash');
var http                  = require('http');
var path                  = require('path');
var os                    = require('os');
var routes                = require('./routes');
var Errors                = require('./lib/errors');
var cleanSessionDir       = require('./lib/session').cleanSessionDir;
var removeConfigLockFiles = require('./lib/instances').removeConfigLockFiles;
// var cas = require('./middleware/casauth.js');


var app = express();

app.configure(function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser({uploadDir: os.tmpdir()}));
  app.use(express.methodOverride());

  app.use(express.cookieParser('keyboard cat'));
  // maxAge: null => browser-life session
  app.use(express.session({ key: 'sid', cookie: { maxAge: null }}));
  app.use(flash());

  app.use(app.router);
  app.use(express["static"](path.join(__dirname, 'public')));
  // middleware to manage errors
  app.use(function errorHandler(err, req, res, next) {
    debug('error', err, err instanceof Errors.NotFound);
    if (!req.user) {
      req.user = "admin@castorjs.org";
    }

    if (err instanceof Errors.NotFound) {
      next();
    }
    else if (err instanceof Errors.BadParameters) {
      res.statusCode = 400;
      res.render('400', { title: 'Bad Request', path: '/', error: err, userName: req.user });
    }
    else if (err instanceof Errors.Forbidden) {
      debug("Forbidden", err);
      res.statusCode = 403;
      res.render('403', { title: 'Forbidden 403', path: '/', error: err, userName: req.user });
    }
    else {
      throw err;
      //next()
      //res.render('500', { title: 'Error', error: err, path: '/' });
    }

  });
  app.use(function errorNotFound(req, res, next) {
    res.statusCode = 404;
    res.render('404', { title: 'Page Inconnue', path: '/', userName: req.user });
  });

});

app.configure('development', function () {
  app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
});

app.configure('production', function () {
    app.use(express.errorHandler());
  }
);


app.get('/'/*, cas.casauth({root: config.cas_server})*/, routes.index);

require('./routes/upload')(app);

require('./routes/instance')(app);

require('./routes/process')(app);

module.exports = function(cb) {
  cleanSessionDir(null, function removeLocks(err) {
    if (err) {
      throw err;
    }
    removeConfigLockFiles(function launchServer(err) {
      if (err) {
        throw err;
      }
      cb(app);
    });
  });
};
