const jwt = require('jsonwebtoken');
const fs = require('fs');
const logger = require("./../../logger");

/**
 * Export of the middleware for authentication
 */
module.exports = (req, res, next) => {
    // search for the token either in the header or in the cookies
    let token = (req.get("Authorization") ? req.get("Authorization").replace("bearer","").trim() : null) || req.cookies['token'];
    if(!token) {
        // NO token , sens status 403
        res.status(403);
        return next(new Error("No token given"));
    }
    // Retrieve secret
    const secret = require("./../secret").secret;
    // verify the token
    jwt.verify(token, secret, function (err, decoded) {
        if (err) {
            // Invalid token
            logger.error("Token not valid");
            if (err.name == 'TokenExpiredError') {
                res.status(401);
                return next(new Error("Token Expired"));
            }
            else {
                res.status(402);
                return next(new Error("Invalid Token"));
            }
        }
        // Authentification successfull
        logger.info("Authentification sucess ! ");
        return next();
    });

}