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
const BlackListCmdsManager = require("./blackListCmdsManager");
const BlackListRoomsManager = require("./blackListRoomsManager");
const ConfigurationManager = require('./ConfigurationManager');
const ApiRouter = require("./API/api");
const database = require('./database');

exports = module.exports = class Adapter {
    constructor({
        brainUrl = "http://localhost",
        token = "",
        mongoURL = "mongodb://localhost:27017/arachne-adapter",
        admins = [],
        gestion = "",
        createApi = false,
        expressApp = null,
        pathApi = "/api",
        dashboard = false,
        sendMessage = () => { }
    } = {}) {
        this.brainUrl = brainUrl;
        this.token = token;
        this.mongoURL = mongoURL;
        this.sendMessage = sendMessage;
        this.admins = admins;
        this.gestion = gestion;
        this.createApi = createApi;
        this.expressApp = expressApp;
        this.pathApi = pathApi;
        this.dashboard = dashboard;
    }

    init() {
        this.configurationManager = new ConfigurationManager(database.database, {
            brainUrl: this.brainUrl,
            token: this.token,
            admins: this.admins,
        },
            (token) => this.updateToken(token),
            (url) => this.updateUrl(url)
        );

        this.initSocket();

        this.threadManager = new ThreadManager();

        this.hookManager = new HookManager(database.database, this.onCloseHook.bind(this));

    }

    dropSocket() {
        if (!this.socket) {
            return;
        }

        this.socket.off('connect');
        this.socket.off('disconnect');
        this.socket.off('connecting');
        this.socket.off('hook');
        return;
    }

    initSocket() {
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
            logger.debug("Received hook " + hookId);

            this.hookManager.handleHook(hookId, body.message).then(({
                room,
                message
            }) => {
                this.sendMessage(room, message);
            }).catch(error => {
                logger.error(`Error when handling hook: ${logger.inspect(error.message)}.`);
                return err('NO_HOOK')
            });
        });
    }

    start() {
        return database.connect(this.mongoURL).then(db => {
            logger.info(`Connected to database.`);
            return this.configurationManager.init().then(() => this.configurationManager.getConfig()).then(config => {
                this.brainUrl = config.brainUrl;
                this.token = config.token;

                this.hookManager.init();
                this.checkCommand = (cmd) => { return false };
                if (this.gestion.includes("blackListCmds")) {
                    this.blackListCmdsManager = new BlackListCmdsManager(database.database);
                    this.checkCommand = (cmd) => { return this.blackListCmdsManager.getLocalCmds().includes(cmd) };
                }
                this.checkRoom = (room) => { return false };
                if (this.gestion.includes("blackListRooms")) {
                    this.blackListRoomsManager = new BlackListRoomsManager(database.database);
                    this.checkRoom = (room) => { return this.blackListRoomsManager.getLocalRooms().includes(room) };
                }
                if (this.createApi && this.expressApp) {
                    return ApiRouter(this.expressApp, this.pathApi, this.dashboard, this.hookManager, this.configurationManager, this.blackListCmdsManager, this.blackListRoomsManager).then(() => {
                        logger.log("API started !");
                    }).catch((err) => {
                        logger.error("Couldn't start API");
                        logger.error(err.message);
                    });
                }
                this.dropSocket();
                this.initSocket();
                this.socket.open();
                return;
            });
        }).catch(err => {
            logger.error(`Error when trying to reach database: ${logger.inspect(err)}.`);
            throw err;
        });
    }

    updateUrl(url) {
        this.brainUrl = url;

        this.configurationManager.persistUrl(url).then(() => {
            this.dropSocket();
            this.initSocket();
            this.socket.open();
        }).catch(err => {
            logger.error(`Could not persist token: ${logger.inspect(err)}.`);
        });
    }

    updateToken(token) {
        this.token = token;

        this.configurationManager.persistToken(token).then(() => {
            this.dropSocket();
            this.initSocket();
            this.socket.open();
        }).catch(err => {
            logger.error(`Could not persist url: ${logger.inspect(err)}.`);
        });
    }

    onCloseHook({
        hookId,
        room
    }) {
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

    handleAdmin({
        command,
        data
    }) {
        return Promise.resolve().then(() => {
            // Checking if user is admin.

            if (!this.configurationManager.isAdmin(data.userName)) {
                return {
                    text: "You are not an administrator.",
                    private: true,
                    privateName: data.userName
                };
            }

            const [cmd, ...args] = command.split(" ");

            switch (cmd) {
                case 'token':
                    if (args[0] && args[0] === "set") {
                        if (!args[1] || args[2]) {
                            return {
                                text: "Type `token set <token>` to set the Arache's token.",
                                private: true,
                                privateName: data.userName
                            };
                        } else {
                            this.updateToken(args[1]);
                            return {
                                text: "The new token is: `" + this.token + "`\nYou should **delete** this message.",
                                private: true,
                                privateName: data.userName
                            };
                        }
                    } else {
                        return {
                            text: "The current token is: `" + this.token + "`\nYou should **delete** this message.",
                            private: true,
                            privateName: data.userName
                        };
                    }
                case 'url':
                    if (args[0] && args[0] === "set") {
                        if (!args[1] || args[2]) {
                            return {
                                text: "Type `url set <url>` to set the Arache's url.",
                                private: true,
                                privateName: data.userName
                            };
                        } else {
                            this.updateUrl(args[1]);
                            return {
                                text: "The new url is: `" + this.brainUrl + "`\nYou should **delete** this message.",
                                private: true,
                                privateName: data.userName
                            };
                        }
                    } else {
                        return {
                            text: "The current url is: `" + this.brainUrl + "`\nYou should **delete** this message.",
                            private: true,
                            privateName: data.userName
                        };
                    }
                case "blackListCmds":
                    console.log(this.gestion);
                    if (this.gestion.includes("blackListCmds")) {
                        if (args[0] && args[0] === "add") {
                            if (args[1]) {
                                return this.blackListCmdsManager.addCmd(args[1]).then(() => {
                                    return {
                                        text: "Cmd : " + args[1] + " added to the blacklisted cmds",
                                        private: true,
                                        privateName: data.userName
                                    };
                                }).catch((err) => {
                                    return {
                                        text: "Couldn't add " + args[1] + " to the blacklisted cmds",
                                        private: true,
                                        privateName: data.userName
                                    }
                                });
                            } else {
                                return {
                                    text: "Missing cmd name",
                                    private: true,
                                    privateName: data.userName
                                }
                            }
                        } else if (args[0] && args[0] === "delete") {
                            if (args[1]) {
                                return this.blackListCmdsManager.deleteCmd(args[1]).then(() => {
                                    return {
                                        text: "Cmd : " + args[1] + " deleted from the blacklisted cmds",
                                        private: true,
                                        privateName: data.userName
                                    };
                                }).catch((err) => {
                                    return {
                                        text: "Couldn't delete " + args[1] + " to the blacklisted cmds",
                                        private: true,
                                        privateName: data.userName
                                    }
                                });
                            } else {
                                return {
                                    text: "Missing cmd name",
                                    private: true,
                                    privateName: data.userName
                                }
                            }

                        } else if (args[0] && args[0] === "list") {
                            let text = "";
                            this.blackListCmdsManager.getLocalCmds().forEach((val) => text += " - " + val + "\n");
                            return {
                                text: "List of blacklisted Cmd : \n" + text,
                                private: true,
                                privateName: data.userName
                            };
                        } else {
                            return {
                                text: " I didn't undestand your cmd, type `+help` for informations"
                            }
                        }
                    } else {
                        return {
                            text: "disabled",
                            private: true,
                            privateName: data.userName
                        }
                    }
                case "blackListRooms":
                    if (this.gestion.includes("blackListRooms")) {
                        if (args[0] && args[0] === "add") {
                            if (args[1]) {
                                return this.blackListRoomsManager.addRoom(args[1]).then(() => {
                                    return {
                                        text: "Rooms : " + args[1] + " added to the blacklisted rooms",
                                        private: true,
                                        privateName: data.userName
                                    };
                                }).catch((err) => {
                                    return {
                                        text: "Couldn't add " + args[1] + " to the blacklisted rooms",
                                        private: true,
                                        privateName: data.userName
                                    }
                                });
                            } else {
                                return {
                                    text: "Missing room name",
                                    private: true,
                                    privateName: data.userName
                                }
                            }
                        } else if (args[0] && args[0] === "delete") {
                            if (args[1]) {
                                return this.blackListRoomsManager.deleteRoom(args[1]).then(() => {
                                    return {
                                        text: "Room : " + args[1] + " deleted from the blacklisted rooms",
                                        private: true,
                                        privateName: data.userName
                                    };
                                }).catch((err) => {
                                    return {
                                        text: "Couldn't delete " + args[1] + " to the blacklisted rooms",
                                        private: true,
                                        privateName: data.userName
                                    }
                                });
                            } else {
                                return {
                                    text: "Missing room name",
                                    private: true,
                                    privateName: data.userName
                                }
                            }

                        } else if (args[0] && args[0] === "list") {
                            let text = "";
                            this.blackListRoomsManager.getLocalRooms().forEach((val) => text += " - " + val + "\n")
                            return {
                                text: "List of blacklisted Rooms : \n" + text,
                                private: true,
                                privateName: data.userName
                            };
                        } else {
                            return {
                                text: " I didn't undestand your cmd, type `+help` for informations"
                            }
                        }
                    } else {
                        return {
                            text: "disabled",
                            private: true,
                            privateName: data.userName
                        }
                    }
                case "admin":
                    if (args[0] && args[0] === "add") {
                        if (args[1]) {
                            return this.configurationManager.addAdmin(args[1]).then(() => {
                                return {
                                    text: "User : " + args[1] + " added to admins",
                                    private: true,
                                    privateName: data.userName
                                };
                            }).catch((err) => {
                                return {
                                    text: "Couldn't add " + args[1] + " to the admins",
                                    private: true,
                                    privateName: data.userName
                                }
                            });
                        } else {
                            return {
                                text: "Missing user name",
                                private: true,
                                privateName: data.userName
                            }
                        }
                    } else if (args[0] && args[0] === "delete") {
                        if (args[1]) {
                            return this.configurationManager.removeAdmin(args[1]).then(() => {
                                return {
                                    text: "User : " + args[1] + " deleted from the admins",
                                    private: true,
                                    privateName: data.userName
                                };
                            }).catch((err) => {
                                return {
                                    text: "Couldn't delete " + args[1] + " from the admins",
                                    private: true,
                                    privateName: data.userName
                                }
                            });
                        } else {
                            return {
                                text: "Missing user name",
                                private: true,
                                privateName: data.userName
                            }
                        }
                    } else if (args[0] && args[0] === "list") {
                        let text = "";
                        this.configurationManager.getConfig().admins.forEach((val) => text += " - " + val + "\n")
                        return {
                            text: "List of admins : \n" + text,
                            private: true,
                            privateName: data.userName
                        };
                    } else {
                        return {
                            text: " I didn't undestand your cmd, type `+help` for informations"
                        }
                    }
                case 'help':
                    let text = "# Administrative Commands.\n`token [set <token>]` → set the arachne's token.\n`url [set <url>]` → set the arachne's url.";
                    text += "\n" + "`admin [add <userName>]` → add a user to the admin list\n" +
                    "`admin [delete <userName>]` → delete a user from the admin list\n"
                    + "`admin [list]` → get the list of admins"
                    if (this.gestion.includes("blackListCmds")) {
                        text += "\n" + "`blackListCmds [add <cmdName>]` → add a cmd to the blacklisted Cmd\n"
                            + "`blackListCmds [delete <cmdName>]` → delete a cmd from the blacklisted Cmd\n"
                            + "`blackListCmds [list]` → list the blacklisted Cmd"
                    }
                    if (this.gestion.includes("blackListRooms")) {
                        text += "\n" + "`blackListRooms [add <roomName>]` → add a room to the blacklisted Room\n"
                            + "`blackListRooms [delete <roomName>]` → delete a room from the blacklisted Room\n"
                            + "`blackListRooms [list]` → list the blacklisted Room"
                    }
                    return {
                        text: text,
                        private: true,
                        privateName: data.userName
                    };
                default:
                    return {
                        text: "Unkown command. Type `help` to get list of administrative commands.",
                        private: true,
                        privateName: data.userName
                    };
            }


            return "Done."
        });
    }

    handleCommand({
        command,
        data
    }) {
        return new Promise((resolve, reject) => {
            this.socket.emit('command', {
                command,
                data
            }, (err, body) => {
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

    handleSentence({
        sentence,
        data
    }) {
        return new Promise((resolve, reject) => {
            this.socket.emit('nlp', {
                phrase: sentence,
                data
            }, (err, body) => {
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

    handleConverse({
        threadId,
        sentence,
        data
    }) {
        return new Promise((resolve, reject) => {
            logger.debug(threadId);
            this.socket.emit('converse', {
                thread_id: threadId,
                phrase: sentence,
                data
            }, (err, body) => {
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

    handleMessage({
        type,
        text,
        room,
        username,
        data
    }) {
        return Promise.resolve().then(() => {
            const sentData = data || {};
            sentData.channel = room;
            sentData.userName = username;

            if (type === 'admin') {
                // This is an administrative operation for the adapter.
                return this.handleAdmin({
                    command: text,
                    data: sentData
                });
            }

            if (this.checkRoom(room)) {
                logger.info(room + " blacklisté");
                return null;
            }

            if (!this.socket) {
                return "I am disconnected from the brain. Please contact an administrator.";
            }

            // Check status with brain.
            if (!this.socket.connected) {
                this.socket.open(); // Attempt to reconnect.
                return "I could not join the brain.\n_(Please try again later, and contact an administrator if this message shows up again.)_";
            }

            return this.threadManager.checkThread(room).then(threadId => {
                if (threadId) {
                    return this.handleConverse({
                        sentence: text,
                        data: sentData,
                        threadId
                    });
                } else {
                    switch (type) {
                        case 'command':
                            if (this.checkCommand(text.split(" ")[0])) {
                                logger.info(text.split(" ")[0] + " blacklisté");
                                return null;;
                            }
                            return this.handleCommand({
                                command: text,
                                data: sentData
                            });
                        case 'sentence':
                            return this.handleSentence({
                                sentence: text,
                                data: sentData
                            });
                        default:
                            throw new Error({
                                message: "Unrecognized type. Can only handle messages of type sentence and command.",
                                id: "UNKOWN_MESSAGE_TYPE"
                            });
                    }
                }
            })
        }).then(response => {
            if (!response) {
                return null;
            }
            // Convert String to message object.
            let message = {};
            if (typeof reponse === "string") {
                message.text = response;
            } else {
                message = response;
            }

            return this.threadManager.handleThread(response.thread, room, response.interactive).then(() => {
                if (response.request_hook) {
                    return this.hookManager.createHook(response.hook, room).then(() => {
                        this.socket.emit('hook-accept', response.hook._id, (err) => {
                            if (err) {
                                logger.error(`Error sending hook acceptance: ${logger.inspect(err)}`);
                                return ({
                                    message: {
                                        text: "The skill attempted to create a hook but an error occured"
                                    }
                                });
                            } else {
                                return response;
                            }
                        });
                    }).catch((err) => {
                        return ({
                            message: {
                                text: "The skill attempted to create a hook but an error occured"
                            }
                        });
                    });
                } else {
                    return response;
                }
            });
        });
    }
}