'use strict';

const extend = require('gextend');
const BaseCommand = require('base-cli-commands').BaseCommand;
const glob = require('globby');
const join = require('path').join;
const resolve = require('path').resolve;
const writeFile = require('fs').writeFile;

class CollectCommand extends BaseCommand {

    execute(event) {
        event = extend({}, CollectCommand.DEFAULTS, event);

        event.source = resolve(event.source);
        event.output = resolve(event.output);

        this.logger.info('Look for files at: %s', event.source);

        return this.loadFiles(event.source).then((files = []) => {
            let model, output = [];

            this.logger.info('Collected %s files.', files.length);
            if (files.length === 0) {
                this.logger.warn('No files found.');
            }

            files.map(filepath => {
                this.logger.info('Process file: %s', filepath);
                filepath = join(event.source, filepath);
                model = require(filepath);
                if (model) output.push(model.schema);
                else {
                    this.logger.warn('Model file %s does not expose an schema property', filepath);
                }
            });

            return this.serializeOutput(event.output, output);

        }).catch(err => {
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

    loadFiles(src) {
        console.log('src', src);
        return glob(['*.js'], { cwd: src }).catch(e => {
            console.error(e);
            return e;
        });
    }

    static describe(prog, cmd) {

        cmd.argument('[source]',
            'Path to directory with model definition JS files',
            /.*/,
            CollectCommand.DEFAULTS.source
        );

        cmd.argument('[output]',
            'Filename for output.',
            /.*/,
            CollectCommand.DEFAULTS.output
        );
    }
}

CollectCommand.DEFAULTS = {
    source: './models',
    output: './waterline.json'
};

CollectCommand.COMMAND_NAME = 'collect';
CollectCommand.DESCRIPTION = 'Collect metadata from waterline models and generates a JSON file with the model definitions';

module.exports = CollectCommand;