'use strict';

const extend = require('gextend');
const glob = require('globby');
const join = require('path').join;
const resolve = require('path').resolve;
const writeFile = require('fs').writeFile;



class CollectCommand {

    constructor(options = {}) {
        extend(this, options);
    }

    execute(event) {
        event = extend({}, CollectCommand.DEFAULTS, event);

        event.source = resolve(event.source);
        event.output = resolve(event.output);

        return this.loadFiles(event.source).then((files) => {
            let model, output = [];

            files.map((filepath) => {
                filepath = join(event.source, filepath);
                model = require(filepath);
                output.push(model.schema);
            });

            return this.serializeOutput(event.output, output);

        }).catch((err) => {
            console.log(err.message);
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
            writeFile(filename, output, (err)=> {
                if(err) return reject(err);
                resolve(output);
            });
        });
    }

    loadFiles(src) {
        return glob(['*.js'], {cwd:src});
    }
}

CollectCommand.DEFAULTS = {
    source: './models',
    output: './waterline.json'
};

module.exports = CollectCommand;
