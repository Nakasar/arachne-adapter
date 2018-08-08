'use strict';
const express = require('express');
let router = express.Router();
const jwt = require('jsonwebtoken');
const secret = require('./secret').secret;
const logger = require('./../logger');

module.exports = function initRouter(serviceConf, serviceHooks, serviceBlackListCmds, serviceBlackListRooms, pathApi) {
    /**
 * Router for the interface of the dashboard
 */
    router.use('/public', express.static(__dirname + '/views'));

    router.get("/", (req, res) => {
        // Check if the user have a token in his cookies
        if (req.cookies['token']) {
            var token = req.cookies['token'];
            // verify the token
            jwt.verify(token, secret, function (err, decoded) {
                if (err) {
                    logger.error("Token not valid");
                    res.render(__dirname + '/views/login.pug',{
                        pathApi
                    });
                } else {
                    // Token valid, prepare the datas to render the dashboard
                    var hooks_tab = null;
                    if (serviceHooks) {
                        hooks_tab = [];
                        serviceHooks.getHooks().forEach((val, key) => {
                            val.key = key;
                            hooks_tab.push(val);
                        });
                    }
                    let config = serviceConf.getConfig();
                    let renderObjects = {
                        hooks: hooks_tab,
                        admins: config.admins,
                        token: config.token,
                        urlBrain: config.brainUrl,
                        pathApi
                    };

                    if (serviceBlackListRooms) {
                        renderObjects.roomsBlackListed = serviceBlackListRooms.getLocalRooms();
                    }
                    if (serviceBlackListCmds) {
                        renderObjects.cmdsBlackListed = serviceBlackListCmds.getLocalCmds();
                    }
                    return res.render(__dirname + '/views/main.pug', renderObjects);
                }
            });
        } else {
            res.render(__dirname + '/views/login.pug',{
                pathApi
            });
        }
    });
    return router;
}