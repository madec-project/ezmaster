/*jshint node:true, laxcomma:true */
"use strict";

var config             = require('../config'),
    getInstancesConfig = require('../lib/instances').getInstancesConfig,
    http = require('http'),
    httpProxy = require('http-proxy'),
    domainProxy = process.env.domainProxy;



/*
 * Proxy redirect middleware
 */

module.exports = function() {

    return function(req, res , next) {

        config.instances = getInstancesConfig();
        var proxy       = httpProxy.createProxyServer({}),
            redirected  = false;

        // IF Reverse proxy used
        if ( (domainProxy) && (req.headers['x-forwarded-server']) && (req.headers['x-forwarded-server'] === domainProxy ) ) {

            /// IF there is the name host (subdomain)
            if ((req.headers['x-forwarded-host'])) {

                var subdomain = (req.headers['x-forwarded-host']).split('.'+ domainProxy); // split subdomain
                //console.log(subdomain[0]);

                // For each instances config
                Object.keys(config.instances, function (key, value) {

                    //console.log('valueID : ', value.id + '  / DOMAIN : ', subdomain[0]);

                    // If technicalname = subdomain
                    if ((value.id) && (value.id == subdomain[0])) {

                        var url = 'http://127.0.0.1:' + value.port;
                        proxy.web(req, res, { target: url });

                        redirected = true;

                    }

                });

                if(!redirected){
                    res.render('404' , { title: 'Not Found !', path: '/', userName: req.user });
                }

            }

        }
        else {
            next();
        }


    };



};