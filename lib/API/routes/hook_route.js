const express = require('express');
const router = express.Router();

module.exports = function initRouter(serviceHook) {
    /**
 * Route to get the hooks
 */
    router.get('/', (req, res, next) => {
        var hooks_out = [];
        serviceHook.getHooks().forEach((val, key) => {
            hooks_out.push({ ID: key, room: val.room, skill: val.skill })
        });
        res.json(hooks_out);
    });

    /**
     * Route to delete a hook
     */
    router.delete('/:idHook', (req, res, next) => {
        var idHook = req.params.idHook;
        if (!idHook || idHook === '' || idHook === undefined) {
            res.json({ success: false, message: "Id null or undefined" });
        }
        serviceHook.removeHook(idHook)
            .then(res.json({ success: true }))
            .catch((err) => {
                res.json({ success: false, message: err });
            });
    });
    return router;
}