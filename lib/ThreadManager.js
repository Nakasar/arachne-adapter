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

exports = module.exports = class ThreadManager {
    constructor() {
        this._threads = new Map();
    }

    /**
     * Take the room ID from the parameters and check if there is a thread associated with this room 
     * 
     * @param room a room ID
     */
    checkThread(room) {
        return Promise.resolve(this._threads.has(room) ? this._threads.get(room).id : null);
    }

    getThreads() {
        return this._threads;
    }


    /**
     * Check if there is no existing thread with the room ID given, if not create it with the thread ID as the key and the room ID as the value
     * 
     * @param thread object with the id of the thread, its duration and the timeout variable
     * @param room the room ID associated to the room
     */
    createThread(thread, room) {
        return Promise.resolve().then(() => {
            // Check if there is a thread associated to the room
            if (!this._threads.has(room)) {
                logger.debug("Create thread in room " + room);

                // Create the thread and the timeout associated to it
                var timeoutvar = setTimeout(() => closeThreadOnTimeout(room), thread.duration * 1000);
                logger.debug("Set timeout to " + thread.duration + " seconds");

                // Set it in the map
                this._threads.set(room, { id: thread.id, duration: thread.duration, timeoutvar });
            } else {
                // Existing thread
                let thread = this._threads.get(room);

                // Refresh the timer of the thread
                clearTimeout(thread.timeoutvar);

                var timeoutvar = setTimeout(() => closeThreadOnTimeout(room), thread.duration * 1000);

                this._threads.set(room, { id: thread.id, duration: thread.duration, timeoutvar });
                logger.debug("Thread in room " + room + " already exist");
            }
            return;
        });
    }

    /**
     * Close the thread from the room with the room ID in parameter 
     * 
     * @param room the room we want to close the thread from
     */
    closeThread(room) {
        return Promise.resolve().then(() => {
            if (this._threads.has(room)) {
                logger.debug("Close Thread " + room);

                var timeout = this._threads.get(room).timeoutvar;
                clearTimeout(timeout);

                this._threads.delete(room);
                return;
            } else {
                logger.debug("No thread in room " + room);

                return;
            }
        });
    }

    /**
     * 
     * @param thread_id a thread ID
     * @param room a room ID
     * @param interactive boolean true / false ( if we have to start a new conversation or not )
     */
    handleThread(thread, room, interactive) {

        if (interactive) {
            return this.createThread(thread, room);
        }
        else {
            return this.closeThread(room);
        }
    }
}