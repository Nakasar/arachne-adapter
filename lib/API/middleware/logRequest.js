const logger = require("./../../logger");
module.exports = (req,res,next)=>{
    let reqDate = new Date();
    logger.log(reqDate +" "+ req.method +" "+ req.path);
    return next();
};