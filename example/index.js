/*jshint esversion:6, node:true*/
'use strict';

let Schema = require('..');
let models = require('./models');

console.log(JSON.stringify(Schema(models), null, 4));
