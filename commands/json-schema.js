'use strict';

const extend = require('gextend');
const BaseCommand = require('base-cli-commands').BaseCommand;

const join = require('path').join;
const resolve = require('path').resolve;
const writeFile = require('fs').writeFile;
const readFile = require('fs').readFile;

const Schema = require('..').jsonSchema;

class JSONSchemaCommand extends BaseCommand {

    execute(event) {
        event = extend({}, JSONSchemaCommand.DEFAULTS, event);

        event.source = resolve(event.source);
        event.output = resolve(event.output);

        this.logger.info('Look for files at: %s', event.source);

        return this.loadSchema(event.source).then(models => {
            return new Promise((resolve, reject) => {
                let output;
                try {
                    output = Schema(models, event.options);
                } catch (e) {
                    return reject(e);
                }
                return this.serializeOutput(event.output, output);
            });
        }).catch((err) => {
            this.logger.error('Error running script');
            this.logger.error(err.message);
            this.logger.error(err);
            return err;
        });
    }

    /**
     * We loose information here, by using
     * `JSON.stringify` all functions are
     * ommited in the output. For now this
     * works well enough.
     * Note that this method can be overriten
     * by providing a function with the name
     * `serializeOutput` in the options object.
     *
     * @param  {String} filename Filename for output
     * @param  {Object} output   Object containing collected schema
     * @return {Promise}         Promise
     */
    serializeOutput(filename, output) {
        return new Promise((resolve, reject) => {
            try {
                output = JSON.stringify(output, null, 4);
            } catch (e) {
                return reject(e);
            }

            writeFile(filename, output, err => {
                if (err) return reject(err);
                resolve(output);
            });
        });
    }

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

    static describe(prog, cmd) {

        cmd.argument('[source]',
            'Path to directory with models',
            /.*/,
            JSONSchemaCommand.DEFAULTS.source
        );

        cmd.argument('[output]',
            'Filename for output.',
            /.*/,
            JSONSchemaCommand.DEFAULTS.output
        );
    }
}

JSONSchemaCommand.DEFAULTS = {
    source: './waterline.json',
    output: './json-schema.json',
    options: {}
};

JSONSchemaCommand.COMMAND_NAME = 'json-schema';
JSONSchemaCommand.DESCRIPTION = 'Generate JSON schema from Waterline metadata file.';

module.exports = JSONSchemaCommand;