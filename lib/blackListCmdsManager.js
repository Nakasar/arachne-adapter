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
        this.collection = database().collection('BlackListedCmds');
        this.updateLocalCmds();
    }

    updateLocalCmds() {
        return new Promise((resolve, reject) => {
            this.getCmds().then((cmds) => {
                this.BlackListCmds = cmds.map((cmd) => cmd.cmdName);
                return resolve();
            }).catch((err) => {
                console.log("Couldn't load cmds in BD");
                console.log(err);
                return reject(err);
            });
        });
    }
    
    /**
     * 
     * @param cmdName the name of the cmd we want to add
     * Add a cmd into the database 
     */
    addCmd(cmdName) {
        return new Promise((resolve, reject) => {
            this.collection.find({ cmdName: cmdName }).toArray((err, cmd) => {
                if (err) {
                    logger.error(err);
                    return reject(err);
                }
                if (cmd.length !== 0) {
                    logger.warn("A cmd with this Name is already blacklisted");
                    return reject("A cmd with this Name is already blacklisted");
                }
                this.collection.insertOne({ cmdName: cmdName }, (err) => {
                    if (err) {
                        logger.error(err);
                        return reject(err);
                    } else {
                        this.BlackListCmds.push(cmdName);
                        return resolve();
                    }
                });
            });
        });
    }
    
    /**
     * 
     * @param cmdName a cmd ID
     * Delete a cmd from the database 
     */
    deleteCmd(cmdName) {
        return new Promise((resolve, reject) => {
            this.collection.findOneAndDelete({ cmdName: cmdName }, (err, res) => {
                if (err) {
                    logger.error(err);
                    return reject(err);
                } else {
                    if (res.value) {
                        this.BlackListCmds.splice(this.BlackListCmds.indexOf(cmdName));
                        return resolve();
                    } else {
                        logger.warn("No cmd with the ID given found");
                        return reject("No cmd with the ID given found");
                    }
                }
            });
        });
    }
    
    /**
     * Retrieve the cmds from the DB
     */
    getCmds() {
        return new Promise((resolve, reject) => {
            this.collection.find({}).toArray((err, cmds) => {
                if (err) {
                    logger.error(err);
                    return reject(err);
                } else {
                    return resolve(cmds);
                }
            });
        });
    }
    
    getLocalCmds() {
        return this.BlackListCmds;
    }
}