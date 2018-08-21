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

exports = module.exports = class HookManager {
    /**
     * 
     * @param {Function} database Should return a mongodb database when called.
     * @param {Function} onCloseHook Emitted with { hookId, room } when a hook is deleted.
     */
    constructor(database, onCloseHook) {
        this._hooks = new Map();
        this.database = database;
        this.onCloseHook = onCloseHook;
    }

    init() {
        this.collection = this.database().collection('hooks');

        this.collection.find({}).toArray().then(hooks => {
            hooks.map((hook) => {
                this._hooks.set(hook.key, {
                    room: hook.room,
                    skill: hook.skill,
                    messageOnDelete: hook.messageOnDelete
                });
            });

            logger.info("Loaded hooks from database.")
            return;
        }).catch(err => {
            logger.error(`Error loading hooks from database ${logger.inspect(err)}.`);
            return;
        });
    }

    /**
     * 
     * @param hook the hook we will create
     * @param  room the room we will create the hook for
     * This function will create a hook with the hook given in parameter for the room given in parameter
     */
    createHook(hook, room) {
        return Promise.resolve().then(() => {
            logger.debug(`Create hook ${hook._id} for room ${room}`);

            return this.collection.insertOne({
                key: hook._id,
                room: room,
                skill: hook.skill,
                messageOnDelete: hook.messageOnDelete
            })
                .then(created => {
                    this._hooks.set(hook._id, {
                        room,
                        skill: hook.skill,
                        messageOnDelete: hook.messageOnDelete
                    });
                    return created.ops[0];
                }).catch(err => {
                    logger.error("Error inserting hook in DB with id " + hook._id);
                    throw err;
                });
        });
    }

    /**
     * 
     * @param hookId the id of the hook we want to remove
     * Remove a hook with the given hookid 
     */
    removeHook(hookId) {
        return new Promise((resolve, reject) => {
            logger.debug(`Closing hook ${hookId}.`)

            const hook = this._hooks.get(hookId);


            // delete from the DB
            this.collection.deleteOne({
                key: hookId
            }, (err) => {
                if (err) {
                    logger.error("Error deleting hook in DB with id " + hookId);
                    return reject(err);
                } else {
                    // This code will emit a message to the brain to told him that he is closing the hook in the adapter
                    this.onCloseHook({
                        hookId,
                        room: hook.room
                    });

                    // Delete from the locals hooks
                    this._hooks.delete(hookId);
                    return resolve();
                }
            });
        });
    }

    /**
     * 
     * @param hookId a hook id
     * @param message the message we sent for the hook
     * This function will handle a hook and print it if the hookid is in the hooks
     * after removing it.
     * Else it will reject an error
     */
    handleHook(hookId, message) {
        return new Promise((resolve, reject) => {
            logger.info(`Handling hook ${hookId}`);

            if (!this._hooks.has(hookId)) {
                return reject('No hook with id ' + hookId);
            }
            let room = this._hooks.get(hookId).room;
            if (message.deleteHook) {
                this.removeHook(hookId).then(() => {
                    return resolve({
                        room,
                        message
                    });
                }).catch((err) => {
                    logger.error(err);
                    return reject(err);
                });
            } else {
                logger.info(`Send message from hook ${hookId}`);
                return resolve({
                    room,
                    message
                });
            }
        });
    }

    /**
     * retrieve the hooks from the local storage
     */
    getHooks() {
        return this._hooks;
    }
}