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

class Logger {
    debug(message) {
        console.log(ARACHNE_DEBUG)
        if (ARACHNE_DEBUG) {
            console.log((new Date()).toISOString() + " ( ARACHNE ) " + message.toString());
        }
    }

    info() {
        console.info((new Date()).toISOString() + " ( ARACHNE ) " + message.toString());
    }

    error() {
        console.error((new Date()).toISOString() + " ( ARACHNE ) " + message.toString());
    }
}

const logger = new Logger();

exports = module.exports = logger;