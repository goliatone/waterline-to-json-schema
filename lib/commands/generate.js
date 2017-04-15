'use strict';

const extend = require('gextend');
const join = require('path').join;
const resolve = require('path').resolve;
const writeFile = require('fs').writeFile;
const readFile = require('fs').readFile;

const Schema = require('..');

class GenerateCommand {

    constructor(options = {}) {
        extend(this, options);
    }

    execute(event) {
        event = extend({}, GenerateCommand.DEFAULTS, event);

        return this.loadSchema(event.source).then((models) => {
            return new Promise((resolve, reject) => {
                let output;
                try {
                    output = Schema(models, event.options);
                } catch(e){
                    return reject(e);
                }
                return this.serializeOutput(event.output, output);
            });
        }).catch((err)=> {
            this.logger.error(err);
            return err;
        });
    }

    loadSchema(filepath) {
        return new Promise((resolve, reject) => {
            readFile(filepath, 'utf-8', (err, content) => {
                if(err) reject(err);
                try {
                    let models = JSON.parse(content);
                    resolve(models);
                } catch(e) {
                    reject(e);
                }
            });
        });
    }

    serializeOutput(filename, output) {
        return new Promise((resolve, reject) => {
            try {
                output = JSON.stringify(output, null, 4);
            } catch (e) {
                return reject(e);
            }
            writeFile(filename, output, (err)=> {
                if(err) return reject(err);
                resolve(output);
            });
        });
    }
}

GenerateCommand.DEFAULTS = {
    source: './waterline.json',
    output: './schema.json',
    options: {}
};

module.exports = GenerateCommand;
