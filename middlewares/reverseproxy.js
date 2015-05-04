/*jshint node:true, laxcomma:true */
"use strict";

var config             = require('../config'),
    getInstancesConfig = require('../lib/instances').getInstancesConfig,
    http = require('http'),
    httpProxy = require('http-proxy'),
    domainEnv = process.env.domainProxy;



/*
 * Proxy redirect middleware
 */

module.exports = function() {

    config.instances = getInstancesConfig();
    var proxy       = httpProxy.createProxyServer({}),
        redirected  = false,
        reqServer,
        reqHost,
        reqSubdomain;

    return function(req, res , next) {

        reqServer = req.headers['x-forwarded-server'];
        reqHost = req.headers['x-forwarded-host'];
        reqSubdomain = reqHost ? reqHost.split('.') : null;

        if(reqSubdomain && (reqServer === domainEnv)){
            for(var i in config.instances){
                if ((config.instances[i].id) && (config.instances[i].id === reqSubdomain[0])) {
                    redirected = true;
                    var url = 'http://127.0.0.1:' + config.instances[i].port;
                    proxy.web(req, res, { target: url });
                    break;
                }
            }
            if(!redirected) {
                res.render('404', { title: 'No any app found :( !', path: '/', userName: req.user });
            }
        }
        else{
            next();
        }

    };

};