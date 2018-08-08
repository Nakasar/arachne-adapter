const logger = require("./../../logger");

module.exports = (err, req, res, next) => {
    if(res.statusCode === 200 ) {
        res.status(500);
    }
    res.send({text: err.message || "Internal server error"});
}
    