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
const HookManager = require('./HookManager');
const database = require('./database');

exports = module.exports = class Adapter {
    constructor({ brainUrl = "http://localhost", token = "", mongoURL = "mongodb://localhost:27017/arachne-adapter", sendMessage = () => {} } = {}) {
        this.brainUrl = brainUrl;
        this.token = token;
        this.mongoURL = mongoURL;
        this.sendMessage = sendMessage;
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
            logger.info("Connected to the Arachne Brain: " + this.brainUrl);
        });

        this.socket.on('disconnect', () => {
            logger.info("Disconnected from brain.");
        });

        this.socket.on('connecting', () => {
            logger.info("Attempting to connect to the Arachne Brain: " + this.brainUrl);
        });

        this.socket.on('hook', (hookId, body, err) => {
            console.log("hello")
            logger.debug("Received hook " + hookId);
            this.hookManager.handleHook(hookId, body.message).then(({ room, message }) => {
                this.sendMessage(room, message);
            }).catch(error => {
                logger.error(`Error when handling hook: ${logger.inspect(error.message)}.`);
                return err('NO_HOOK')
            });
        });

        this.threadManager = new ThreadManager();

        this.hookManager = new HookManager(database.database, this.onCloseHook.bind(this));
    }

    start() {
        database.connect(this.mongoURL).then(db => {
            logger.info(`Connected to database.`)
            this.socket.open();

            this.hookManager.init();
        }).catch(err => {
            logger.error(`Error when trying to reach database: ${logger.inspect(err)}.`);
        });
    }

    onCloseHook({ hookId, room }) {
        if (!this.socket || !this.socket.connected) {
            logger.error("Trying to alert the brain that a hook was closed. But the adapter is not connected.")
        }

        this.socket.emit('close-hook', hookId, (message) => {
            logger.debug("Brain confirmed deletion of hook " + hookId);
            if (message && message !== "") {
                logger.info("Messaging room " + room + ": " + message)
            }
        })
    }

    handleCommand({ command, data }) {
        return new Promise((resolve, reject) => {
            this.socket.emit('command', { command, data }, (err, body) => {
                if (err) {
                    logger.error(`Error when handling command response: ${logger.inspect(err)} with body: ${logger.inspect(body)}.`);
                    return resolve("An unkown error occured, I'm sorry.");
                }

                if (!body.success) {
                    logger.error(`Unsuccessful respone with command endpoint: ${logger.inspect(body)}.`);
                    return resolve("The server could not handle this request.");
                }

                if (!body.message) {
                    return resolve("I recognized this command, but the server returned an empty message.");
                }

                return resolve(body.message);
            });
        });
    }

    handleSentence({ sentence, data }) {
        return new Promise((resolve, reject) => {
            this.socket.emit('nlp', { phrase: sentence, data }, (err, body) => {
                if (err) {
                    logger.error(`Error when handling nlp response: ${logger.inspect(err)} with body: ${logger.inspect(body)}.`);
                    return resolve("An unkown error occured, I'm sorry.");
                }

                if (!body.success) {
                    logger.error(`Unsuccessful respone with nlp endpoint: ${logger.inspect(body)}.`);
                    return resolve("The server could not handle this request.");
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
            logger.debug(threadId);
            this.socket.emit('converse', { thread_id: threadId, phrase: sentence, data }, (err, body) => {
                if (err) {
                    logger.error(`Error when handling converse response: ${logger.inspect(err)} with body: ${logger.inspect(body)}.`);
                    return resolve("An unkown error occured, I'm sorry.");
                }

                if (!body.success) {
                    logger.error(`Unsuccessful respone with converse endpoint: ${logger.inspect(body)}.`);
                    return resolve("The server could not handle this request.");
                }

                if (!body.message) {
                    return resolve("I sent back your response, but the server returned an empty message.");
                }

                return resolve(body.message);
            });
        });
    }

    handleMessage({ type, text, room, username, data }) {
        return Promise.resolve().then(() => {
            if (!this.socket) {
                return "I am disconnected from the brain. Please contact an administrator.";
            }

            // Check status with brain.
            if (!this.socket.connected) {
                this.socket.open(); // Attempt to reconnect.
                return "I could not join the brain.\n_(Please try again later, and contact an administrator if this message shows up again.)_";
            }

            const sentData = data || {};
            sentData.channel = room;
            sentData.userName = username;

            return this.threadManager.checkThread(room).then(threadId => {
                if (threadId) {
                    return this.handleConverse({ sentence: text, data: sentData, threadId });
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

            return this.threadManager.handleThread(response.thread, room, response.interactive).then(() => {
                if (response.request_hook) {
                    this.hookManager.createHook(response.hook, room);
                    this.socket.emit('hook-accept', response.hook._id, (err) => {
                        if (err) {
                            logger.error(`Error sending hook acceptance: ${logger.inspect(err)}`);
                        }
                    });
                }
                return response;
            });
        });
    }
}