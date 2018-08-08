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

const ARACHNE_DEBUG = process.env.ARACHNE_DEBUG || false;

const inspect = require('util').inspect;

class Logger {
    log(message) {
        this.info(message);
    }

    debug(message) {
        if (ARACHNE_DEBUG) {
            console.log((new Date()).toISOString() + " ( ARACHNE ) " + (typeof message === "string" ? message : inspect(message)));
        }
    }

    info(message) {
        console.info((new Date()).toISOString() + " ( ARACHNE ) " + (typeof message === "string" ? message : inspect(message)));
    }

    error(message) {
        console.error((new Date()).toISOString() + " ( ARACHNE ) " + (typeof message === "string" ? message : inspect(message)));
    }

    inspect(object) {
        return inspect(object);
    }

    warning(message) {
        console.error((new Date()).toISOString() + " ( ARACHNE ) " + "[WARNING]" + (typeof message === "string" ? message : inspect(message)));
    }
}

const logger = new Logger();

exports = module.exports = logger;