/*jslint node: true, maxlen: 100, maxerr: 50, indent: 2, laxcomma: true */
"use strict";
// Define errors to use within CASTOR
// See http://dustinsenos.com/articles/customErrorsInNode
// See http://expressjs.com/guide.html#error-handling

var debug = require('debug')('castor:admin:errors');
var util = require('util');

// Abstract Error
var AbstractError = function (msg, constr) {
  Error.captureStackTrace(this, constr || this);
  this.message = msg || this.name || 'Error';
};

util.inherits(AbstractError, Error);

AbstractError.prototype.name = 'Abstract Error';

// Database Error
var DatabaseError = function (msg) {
  DatabaseError.super_.call(this, msg, this.constructor);
};

util.inherits(DatabaseError, AbstractError);

DatabaseError.prototype.name = 'Database Error';

// Not Found Error
var NotFoundError = function (msg) {
  NotFoundError.super_.call(this, msg, this.constructor);
};

util.inherits(NotFoundError, AbstractError);

NotFoundError.prototype.name = 'NotFound Error';

// Forbidden Error
var ForbiddenError = function (msg) {
  ForbiddenError.super_.call(this, msg, this.constructor);
};

util.inherits(ForbiddenError, AbstractError);

ForbiddenError.prototype.name = 'Forbidden Error';

// Bad URL Error
var BadUrlError = function (msg) {
  BadUrlError.super_.call(this, msg, this.constructor);
};

util.inherits(BadUrlError, AbstractError);

BadUrlError.prototype.name = 'Bad Url Error';

// Bad Parameters Error
var BadParametersError = function (msg) {
  BadParametersError.super_.call(this, msg, this.constructor);
};

util.inherits(BadParametersError, AbstractError);

BadParametersError.prototype.name = 'Bad Parameters Error';


// Module
module.exports = {
  Database: DatabaseError,
  Forbidden: ForbiddenError,
  NotFound: NotFoundError,
  BadUrl: BadUrlError,
  BadParameters: BadParametersError
};
