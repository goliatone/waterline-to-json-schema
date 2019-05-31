'use strict';

const extend = require('gextend');
const BaseCommand = require('base-cli-commands').BaseCommand;
const glob = require('globby');
const { join, resolve } = require('path');
const { writeFile, existsSync } = require('fs');

class CollectCommand extends BaseCommand {

    /**
     * We can pass a path to a js file we can use to filter 
     * out models so that they are not collected.
     * 
     * ```js
     * module.exports = function filter(model){
     *   if(!model || !model.schema) return true;
     *   //only models in this array will be collected
     *   const okModels = ['device', 'config', 'metadata'];
     *   if(okModels.includes(model.schema.identity)) return false;
     *   return true;
     * };
     * ```
     * @param {Object} event Event object
     * @param {String} [event.source="./models"] Path to models dir
     * @param {String} [event.output="./waterline.json"] Path to output file 
     * @param {String} event.filter Path to JS filter file 
     */
    execute(event) {
        event = extend({}, CollectCommand.DEFAULTS, event);

        event.source = resolve(event.source);
        event.output = resolve(event.output);

        this._parseFilter(event);

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

                /**
                 * TODO: If we wanted to filter out which models we 
                 * collect, we could take an external script to filter.
                 * filter = this.filter;
                 * if(event.filter) filter = require(event.filter)
                 */
                if (!this.filter(model)) output.push(model.schema);
                else {
                    this.logger.warn('Model file %s has been filetered out', filepath);
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

    filter(model) {
        return !model || !model.schema;
    }

    /**
     * 
     * @param {Object} event 
     */
    _parseFilter(event) {
        if (!event.options || !event.options.filter) return;
        event.options.filter = resolve(event.options.filter);
        if (!existsSync(event.options.filter)) throw new Error('Filter file does not exist');
        let f = require(event.options.filter);
        if (!typeof f === 'function') throw new Error('Wrong type');
        this.filter = f.bind(this);
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

        cmd.option('--filter <filter>',
            'Path to file to filter models to be collected.',
            /.*\.js/
        )
    }
}

CollectCommand.DEFAULTS = {
    source: './models',
    output: './waterline.json',
    options: {}
};

CollectCommand.COMMAND_NAME = 'collect';
CollectCommand.DESCRIPTION = 'Collect metadata from waterline models and generates a JSON file with the model definitions';

module.exports = CollectCommand;
