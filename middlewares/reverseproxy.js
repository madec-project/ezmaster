/*jshint node:true, laxcomma:true */
"use strict";

var config             = require('../config');
var getInstancesConfig = require('../lib/instances').getInstancesConfig;
var http = require('http');
var httpProxy = require('http-proxy');


/*
 * Proxy redirect middleware
 */

module.exports = function() {

    return function(req, res) {

        config.instances = getInstancesConfig();
        var proxy = httpProxy.createProxyServer({});

        // IF Reverse proxy used
        if ((req.headers['x-forwarded-server']) && (req.headers['x-forwarded-server'] === 'termith.inist.fr')) {

            /// IF there is the name host (subdomain)
            if ((req.headers['x-forwarded-host'])) {

                var subdomain = (req.headers['x-forwarded-host']).split('.termith.inist.fr'); // split subdomain
                //console.log(subdomain[0]);

                // For each instances config
                Object.keys(config.instances, function (key, value) {

                    //console.log('valueID : ', value.id + '  / DOMAIN : ', subdomain[0]);

                    // If technicalname = subdomain
                    if ((value.id) && (value.id == subdomain[0])) {

                        var url = 'http://127.0.0.1:' + value.port;
                        proxy.web(req, res, { target: url });

                    }

                })

            }

        }

    }


};