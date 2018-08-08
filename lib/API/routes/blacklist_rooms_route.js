const express = require('express');
const router = express.Router();


module.exports = function initRouter(serviceBlacklistRooms) {
    /**
 * Get routes to retrieve the black listed rooms
 */
    router.get('/', (req, res, next) => {
        serviceBlacklistRooms.getRooms()
            .then((rooms) => res.json(rooms))
            .catch((err) => res.json({ success: false, text: "Couldn't get rooms from db " + err }));
    });

    /**
     * Post route to add a room to the black listed rooms
     */
    router.post('/:nameRoom', (req, res, next) => {
        var roomName = req.params.nameRoom;
        if (!roomName || roomName === '') {
            return res.json({ success: false, text: "Parameters empty or null" });
        }
        serviceBlacklistRooms.addRoom(roomName)
            .then(res.json({ sucess: true }))
            .catch((err) => res.json({ success: false, text: err }));
    });

    /**
     * Delete route to delete a black listed room with his Name
     */
    router.delete('/:roomName', (req, res, next) => {
        var roomName = req.params.roomName;
        if (!roomName || roomName === '') {
            return res.json({ sucess: false, text: "Room Name empty or null" });
        }
        serviceBlacklistRooms.deleteRoom(roomName)
            .then(res.json({ sucess: true }))
            .catch((err) => res.json({ success: false, text: err }));
    });
    return router;
}