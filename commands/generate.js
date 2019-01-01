'use strict';

const extend = require('gextend');
const BaseCommand = require('base-cli-commands').BaseCommand;

const join = require('path').join;
const resolve = require('path').resolve;
const writeFile = require('fs').writeFile;
const readFile = require('fs').readFile;

const Schema = require('..');

class GenerateCommand extends BaseCommand {

    execute(event) {
        event = extend({}, GenerateCommand.DEFAULTS, event);

        event.source = resolve(event.source);
        event.output = resolve(event.output);

        event.options.logger = this.logger;

        this.logger.debug('Look for files at: %s', event.source);

        return this.loadSchema(event.source).then(models => {
            return new Promise((resolve, reject) => {
                let output;

                try {
                    output = Schema(models, event.options);
                } catch (e) {
                    return reject(e);
                }

                return resolve(this.serializeOutput(event.output, output));
            });
        }).catch((err) => {
            this.logger.error('Error running script');
            this.logger.error(err.message);
            this.logger.error(err);
            return err;
        });
    }

    /**
     * @TODO Make BaseCommand.loadJSON
     * @param {String} filepath Filepath
     */
    loadSchema(filepath) {
        return new Promise((resolve, reject) => {
            readFile(filepath, 'utf-8', (err, content) => {
                if (err) reject(err);
                try {
                    let models = JSON.parse(content);
                    resolve(models);
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    /**
     * @TODO Make BaseCommand.saveJSON
     * @param {String} filename 
     * @param {String} output 
     */
    serializeOutput(filename, output) {
        return new Promise((resolve, reject) => {
            try {
                output = JSON.stringify(output, null, 4);
            } catch (e) {
                return reject(e);
            }
            writeFile(filename, output, (err) => {
                if (err) return reject(err);
                resolve(output);
            });
        });
    }

    static describe(prog, cmd) {
        cmd.argument('[source]',
            'Path to JSON file with model definition, generated via collect command',
            /.*/,
            GenerateCommand.DEFAULTS.source
        );

        cmd.argument('[output]',
            'Filename for output.',
            /.*/,
            GenerateCommand.DEFAULTS.output
        );

        cmd.option('--uri-prefix <prefix>',
            'Add <prefix> to all element ids'
        );
    }
}

GenerateCommand.DEFAULTS = {
    source: './waterline.json',
    output: './schema.json',
    options: {}
};

GenerateCommand.COMMAND_NAME = 'generate';
GenerateCommand.DESCRIPTION = 'Transform a file with model definitions into json-schema format.';

module.exports = GenerateCommand;