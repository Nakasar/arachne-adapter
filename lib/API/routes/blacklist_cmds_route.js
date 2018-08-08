const express = require('express');
const router = express.Router();


module.exports = function initRouter(serviceBlacklistcmds) {
    /**
 * Get routes to retrieve the black listed cmds
 */
    router.get('/', (req, res, next) => {
        serviceBlacklistcmds.getCmds()
            .then((cmds) => res.json(cmds))
            .catch((err) => res.json({ success: false, text: "Couldn't get cmds from db " + err }));
    });

    /**
     * Post route to add a cmd to the black listed cmds
     */
    router.post('/:namecmd', (req, res, next) => {
        var cmdName = req.params.namecmd;
        if (!cmdName || cmdName === '') {
            return res.json({ success: false, text: "Parameters empty or null" });
        }
        serviceBlacklistcmds.addCmd(cmdName)
            .then(res.json({ sucess: true }))
            .catch((err) => res.json({ success: false, text: err }));
    });

    /**
     * Delete route to delete a black listed cmd with his ID 
     */
    router.delete('/:cmdName', (req, res, next) => {
        var cmdName = req.params.cmdName;
        if (!cmdName || cmdName === '') {
            return res.json({ sucess: false, text: "cmd ID empty or null" });
        }
        serviceBlacklistcmds.deleteCmd(cmdName)
            .then(res.json({ sucess: true }))
            .catch((err) => res.json({ success: false, text: err }));
    });
    return router;
}

