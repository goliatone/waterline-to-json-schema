/*jshint esversion:6, node:true*/
'use strict';

const Schema = require('..');
const models = require('./models');

console.log(JSON.stringify(Schema(models, {uriPrefix: 'admin'}), null, 4));
