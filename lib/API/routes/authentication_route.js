const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const logger = require("./../../logger");
const fs = require('fs');
const path = require('path');
var pubKey = fs.readFileSync(path.join(__dirname, './pubKey.pem'));
const secret = require("./../secret").secret;
const axios = require("axios");

module.exports = function initRouter(serviceAdmin) {
    /**
 * Post route to authenticate an user with the AD and creating a token for that person
 */
    router.post('/', (req, res, next) => {
        // verify that there is an username and a password in the body
        if (!req.body.username && !req.body.password) {
            res.sendStatus(400);
        } else {
            // Verify that the authenticate person is an admin
            if (serviceAdmin.isAdmin(req.body.username)) {
                // request to ad to ensure that credentials are correct
                axios({
                    url: 'https://si-ad.intech.lu/authentication',
                    method: 'POST',
                    data: {
                        username: req.body.username,
                        password: req.body.password
                    },
                }).then((response) => {
                    if (!jwt.verify(response.data.accessToken, pubKey)) return next({ code: 403, msg: new Error("UNAUTHORIZED") });
                    // Sign a token for this user
                    jwt.sign({
                        exp: Math.floor(new Date().getTime() / 1000) + (60 * 60)
                    }, secret, (err, token) => {
                        if (err) {
                            res.sendStatus(403);
                            return res.json({ error: "Couldn't sign token" });
                        } else {
                            res.json({ token: token });
                        }
                    });
                }).catch((err) => {
                    if (err.response && err.response.status === 403) {
                        res.status(403);
                        return res.json({ error: "Invalid credentials :(" });
                    } else {
                        console.log(err);
                        logger.error(err.message);
                        return res.sendStatus(500);
                    }
                });
            } else {
                res.status(403);
                return res.json({ error: "You're not an admin :(" });
            }
        }
    });
    return router;
}



