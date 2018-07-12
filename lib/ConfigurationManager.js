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

exports = module.exports = class ConfigurationManager {
    /**
     * 
     * @param {Function} database Should return a mongodb database when called.
     */
    constructor(database, config) {
        this.database = database;
        this.config = config;
        if (!this.config.admins) {
            this.config.admins = [];
        }
    }

    init() {
        this.configCollection = this.database().collection('config');

        return this.configCollection.findOne({}).then(config => {
            if (!config) {
                return this.configCollection.insertOne(this.config).then(() => {
                    return;
                });
            }
            this.config = config;
            return;
        });
    }

    getConfig() {
        return this.config;
    }

    persistToken(token) {
        logger.info(`Updating token to ${token.substring(0, 6)}(...) .`);
        this.config.token = token;
        return this.configCollection.updateOne({}, { $set: { token }});
    }

    persistUrl(brainUrl) {
        logger.info(`Modifying brain url to ${brainUrl}.`);
        this.config.brainUrl = brainUrl;
        return this.configCollection.updateOne({}, { $set: { brainUrl }});
    }

    addAdmin(admin) {
        return Promise.resolve().then(() => {
            if (this.config.admins.includes(admin)) {
                throw new Error({ message: "User already in admin list.", id: "USER_ALREADY_ADMIN" });
            }

            logger.info(`Adding ${admin} to list of administrators.`);
            this.config.admins.push(admin);
            
            return this.configCollection.updateOne({}, { $set: { admins: this.config.admins }});
        });
    }

    removeAdmin(admin) {
        return Promise.resolve().then(() => {
            if (this.config.admins.length === 1) {
                throw new Error({ message: "Cannot delete last admin user (yourself).", id: "ONE_AMIN_REMAINING" });
            }

            logger.info(`Removing ${admin} from list of administrators.`);
            this.config.admins.splice(this.config.admins.indexOf(admin), 1);

            return this.configCollection.updateOne({}, { $set: { admins: this.config.admins }});
        });
    }

    isAdmin(user) {
        return this.config.admins.includes(user);
    }

}