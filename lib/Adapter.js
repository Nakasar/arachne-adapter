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

const io = require('socket.io-client');

const logger = require('./logger');
const ThreadManager = require('./ThreadManager');

exports = module.exports = class Adapter {
    constructor({ brainUrl = "http://localhost", token = "" } = {}) {
        this.brainUrl = brainUrl;
        this.token = token;
    }

    init() {
        this.socket = io(this.brainUrl, {
            autoConnect: false,
            reconnection: true,
            transportOptions: {
                polling: {
                    extraHeaders: {
                        'x-access-token': this.token
                    }
                }
            }
        });

        this.socket.on('connect', () => {
            console.log("(Arachne) Connected to the Arachne Brain: " + this.brainUrl);
        });
        
        this.socket.on('disconnect', () => {
            console.log("(Arachne) Disconnected from brain.");
        });

        this.socket.on('connecting', () => {
            console.log("(Arachne) Attempting to connect to the Arachne Brain: " + this.brainUrl);
        });

        this.threadManager = new ThreadManager();
    }

    start() {
        this.socket.open();
    }

    handleCommand({ command, data }) {
        return new Promise((resolve, reject) => {
            this.socket.emit('command', { command, data }, (err, body) => {
                if (!body.success) {
                    return resolve("> An unkown error occured, I'm sorry.");
                }

                if (!body.message) {
                    return resolve("> I recognized this command, but the server returned an empty message.");
                }

                return resolve(body.message);
            });
        });
    }

    handleSentence({ sentence, data }) {
        return new Promise((resolve, reject) => {
            this.socket.emit('nlp', { phrase: sentence, data }, (err, body) => {
                if (!body.success) {
                    return resolve("> An unkown error occured, I'm sorry.");
                }

                if (!body.message) {
                    return resolve("> I understood what you said, but the server returned an empty message.");
                }

                return resolve(body.message);
            });
        });
    }

    handleConverse({ threadId, sentence, data }) {
        return new Promise((resolve, reject) => {
            this.socket.emit('converse', { phrase: sentence, data }, (err, body) => {
                if (!body.success) {
                    return resolve("An unkown error occured, I'm sorry.");
                }

                if (!body.message) {
                    return resolve("I sent back your response, but the server returned an empty message.");
                }

                return resolve(body.message);
            });
        });
    }

    handleMessage({ type, text, channel, username, data }) {
        return Promise.resolve().then(() => {
            // Check status with brain.
            if (!this.socket.connected) {
                this.socket.open(); // Attempt to reconnect.
                return "I could not join the brain.\n_(Please try again later, and contact an administrator if this message shows up again.)_";
            }

            const sentData = data || {};
            sentData.channel = channel;
            sentData.username = username;

            return this.threadManager.checkThread(channel).then(threadId => {
                if (threadId) {
                    return this.handleConverse({ sentence: text, data: sentData, thread_id: threadId });
                } else {
                    switch (type) {
                        case 'command':
                            return this.handleCommand({ command: text, data: sentData });
                        case 'sentence':
                            return this.handleSentence({ sentence: text, data: sentData });
                        default:
                            throw new Error({ message: "Unrecognized type. Can only handle messages of type sentence and commad.", id: "UNKOWN_MESSAGE_TYPE" });
                    }
                }
            })
        }).then(response => {
            // Convert String to message object.
            let message = {};
            if (typeof reponse === "string") {
                message.text = response;
            } else {
                message = response;
            }

            return this.threadManager.handleThread(response.thread, channel, response.interactive).then(() => {
                return response;
            });
        });
    }
}