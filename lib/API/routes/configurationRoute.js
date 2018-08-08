const express = require('express');
const router = express.Router();

module.exports = function initRouter(serviceConf) {
    /**
 * route to get the token for the brain
 */
    router.get('/token', (req, res, next) => {
        return res.json({ sucess: true, token: serviceConf.getConfig().token });
    });

    /**
     * Post route to add a new token 
     */
    router.post('/token/:newToken', (req, res, next) => {
        var newToken = req.params.newToken;
        if (!newToken || newToken === '') {
            return res.json({ success: false, error: "No token found" });
        }
        try {
            serviceConf.updateToken(newToken);
            return res.json({ sucess: true });
        } catch (e) {
            console.log(e);
            return res.json({ sucess: false });
        }

    });
    /**
 * route to get the url to the brain
 */
    router.get('/url', (req, res, next) => {
        return res.json({ success: true, urlBrain: serviceConf.getConfig().brainUrl });
    });

    /**
     * Post route to modify the url to the brain
     */
    router.post('/url', (req, res, next) => {
        var newUrlBrain = req.body.newUrlBrain;
        if (!newUrlBrain || newUrlBrain === '') {
            return res.json({ success: false, error: "No url found" });
        }
        try {
            serviceConf.updateUrl(newUrlBrain);
            return res.json({ sucess: true });
        } catch (e) {
            console.log(e);
            return res.json({ sucess: false });
        }
    });
    /**
* Get route to get the admins
*/
    router.get('/admin', (req, res, next) => {
        return res.json(serviceConf.getConfig().admins);
    });

    /**
     * Delete route to delete an admin with an id
     */
    router.delete('/admin/:nameAdmin', (req, res, next) => {
        var nameAdmin = req.params.nameAdmin;
        if (!nameAdmin || nameAdmin === "") {
            return res.json({ success: false, text: "Name is empty or null" });
        }

        serviceConf.removeAdmin(nameAdmin)
            .then(() => {
                return res.json({ success: true })
            })
            .catch((err) => {
                return res.json({ success: false, text: "Couldn't delete admin from db " + err });
            });
    });

    /**
     * Post route to add an admin with a name
     */
    router.post('/admin/:nameToInsert', (req, res, next) => {
        var nameToInsert = req.params.nameToInsert;
        if (nameToInsert === "" || !nameToInsert) {
            return res.json({ success: false, text: "Name is empty or null" });
        }
        serviceConf.addAdmin(nameToInsert)
            .then(() => {
                return res.json({ success: true })
            })
            .catch((err) => {
                return res.json({ success: false, message: "Could't insert a new admin in db " + err });
            });
    });
    return router;
}
