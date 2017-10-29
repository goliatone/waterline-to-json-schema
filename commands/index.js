'use strict';

const Collect = require('./collect');
const Generate = require('./generate');

module.exports.attach = function(prog, namespace=false) {
    Collect.attach(prog, namespace);
    Generate.attach(prog, namespace);
};
