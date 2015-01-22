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

        // IF NO ENV VARIABLE PROXY
        if(!domainProxy){

            //IF HEADER DOMAIN SEND
            if ( (req.headers['x-forwarded-server']) ){
                res.render('404' , { title: 'Not Found !', path: '/', userName: req.user });
            }
            // ACCES ADMIN
            else{
                next();
            }

        }
        else{
            //IF HEADER DOMAIN SEND
            if ( (req.headers['x-forwarded-server']) ) {

                //IF HEADER DOMAIN = ENV PROXY
                if (req.headers['x-forwarded-server'] === domainProxy ){

                    /// IF there is the name host (subdomain)
                    if ((req.headers['x-forwarded-host'])) {

                        var subdomain = (req.headers['x-forwarded-host']).split('.'+ domainProxy); // split subdomain

                        // For each instances config
                        Object.keys(config.instances, function (key, value) {

                            // If technicalname = subdomain
                            if ((value.id) && (value.id == subdomain[0])) {

                                var url = 'http://127.0.0.1:' + value.port;
                                proxy.web(req, res, { target: url });

                                redirected = true;

                            }

                        });

                        //IF NO INSTANCES HAVE REDIRECTED
                        if(!redirected){
                            res.render('404' , { title: 'Not Found !', path: '/', userName: req.user });
                        }

                    }
                }
                //IF HEADER DOMAIN != ENV PROXY
                else{
                    res.render('404' , { title: 'Not Found !', path: '/', userName: req.user });
                }

            }
            //IF HEADER DOMAIN NOT SEND
            else{
                next();
            }

        }


    };



};