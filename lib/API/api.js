var cookieParser = require('cookie-parser');
const logger = require('./../logger');
const express = require("express");

module.exports = function init(expressApp, pathApi, isDashBoard, serviceHook, serviceConf, serviceBlackListCmds, serviceBlackListRooms) {
    return new Promise((resolve, reject) => {
        const router = express.Router();

        router.use(cookieParser());

        router.use(require('./middleware/logRequest'));

        router.use(express.urlencoded({ extended: false }));

        router.use('/auth', require('./routes/authentication_route')(serviceConf));

        if (isDashBoard) {
            router.use("/dashboard", require("./routerDashboard")(serviceConf, serviceHook, serviceBlackListCmds, serviceBlackListRooms, pathApi));
            logger.info("Starting DashBoard ... ");
        }

        router.use(require('./middleware/authValidation'));

        router.use("/", require("./routes/configurationRoute")(serviceConf));

        router.use("/hooks", require("./routes/hook_route")(serviceHook));

        if (serviceBlackListCmds) {
            router.use("/blacklistCmds", require("./routes/blacklist_cmds_route")(serviceBlackListCmds));
        }

        if (serviceBlackListRooms) {
            router.use("/blacklistRooms", require("./routes/blacklist_rooms_route")(serviceBlackListRooms));
        }

        router.use(require('./middleware/errorHandler'));

        logger.info('API created !');
        try {
            expressApp.use(pathApi, router);
        } catch (e) {
            console.log(e);
        }
        return resolve();

    });
}