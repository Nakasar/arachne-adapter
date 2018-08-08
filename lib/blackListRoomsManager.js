/*!
 *
 *  ARACHNE GENERIC LIBRARY FOR ADAPTERS
 *   JAVASCRIPT
 *
 * Copyright(c) 2018 Kevin 'Nakasar' Thizy
 * Copyright(c) 2018 Intech SA
 * MIT Licensed
 */

'use strict';

const logger = require('./logger');

exports = module.exports = class BlackListCmdsManager {
    /**
         * 
         * @param {Function} database Should return a mongodb database when called.
         */
    constructor(database) {
        this.collection = database().collection('BlackListedRooms');
        this.updateLocalRooms().then().catch();
    }

    updateLocalRooms() {
        return new Promise((resolve, reject) => {
            this.getRooms().then((rooms) => {
                this.blackListedRooms = rooms.map((room) => room.roomName);
                return resolve();
            }).catch((err) => {
                console.log("Couldn't load rooms in BD");
                console.log(err);
                return reject();
            });
        });
    }

    /**
     * 
     * @param roomName the name of the room we want to add
     * Add a room into the database 
     */
    addRoom(roomName) {
        return new Promise((resolve, reject) => {
            this.collection.find({ roomName: roomName }).toArray((err, room) => {
                if (err) {
                    logger.error(err);
                    return reject(err);
                }
                if (room.length !== 0) {
                    logger.warn("A room with this Name is already blacklisted");
                    return reject("A room with this Name is already blacklisted");
                }
                this.collection.insertOne({ roomName: roomName }, (err) => {
                    if (err) {
                        logger.error(err);
                        return reject(err);
                    } else {
                        this.blackListedRooms.push(roomName);
                        return resolve();
                    }
                });
            });
        });
    }

    /**
     * 
     * @param roomID a room ID
     * Delete a room from the database 
     */
    deleteRoom(roomID) {
        return new Promise((resolve, reject) => {
            this.collection.findOneAndDelete({ roomName: roomID }, (err, res) => {
                if (err) {
                    logger.error(err);
                    return reject(err);
                } else {
                    if (res.value) {
                        this.blackListedRooms.splice(this.blackListedRooms.indexOf(roomID), 1);
                        return resolve();
                    } else {
                        logger.warn("No room with the ID given found");
                        return reject("No room with the ID given found");
                    }
                }
            });
        });
    }

    /**
     * Retrieve the rooms from the DB
     */
    getRooms() {
        return new Promise((resolve, reject) => {
            this.collection.find({}).toArray((err, rooms) => {
                if (err) {
                    logger.error(err);
                    return reject(err);
                } else {
                    return resolve(rooms);
                }
            });
        });
    }

    getLocalRooms() {
        return this.blackListedRooms;
    }
}