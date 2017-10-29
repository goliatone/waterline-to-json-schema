'use strict';

const Collect = require('./collect');
const Generate = require('./generate');
/**
 * Attach commands to given application context,
 * if a `namespace` is given then commands will 
 * be added as sub-commands.
 */
module.exports.attach = function $attach(app, namespace=false) {
    
    const context = {
        namespace,
        prog: app.prog
    };

    Collect.attach(context);
    Generate.attach(context);
};
