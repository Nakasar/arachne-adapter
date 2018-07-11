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

/**
 * Module Dependencies
 */
const Adapter = require('./Adapter');

exports = module.exports = createAdapter;

/**
 * Create an Arachne Adapter.
 * 
 * @return {Function}
 * @api public
 */
function createAdapter(params) {
    const adapter = new Adapter(params);

    adapter.init();
    return adapter;
}