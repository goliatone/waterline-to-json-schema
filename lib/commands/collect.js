'use strict';

const extend = require('gextend');
const glob = require('globby');
const join = require('path').join;
const resolve = require('path').resolve;
const writeFile = require('fs').writeFile;

class CollectCommand {

    constructor(options = {}) {
        extend(this, options)
    }

    execute(event) {
        event.source = resolve(event.source);

        return this.loadFiles(event.source).then((files) => {
            let model, output = [];

            files.map((filepath)=> {
                console.log('Here', filepath);
                filepath = join(event.source, filepath);
                model = require(filepath);
                output.push(model.schema);
                // this.logger.warn(model.schema.identity);
            });

            this.logger.info(output);
            return writeFile('./out.json', JSON.stringify(output, null, 4));
        }).catch((err) => {
            console.log(err.message);
            return err;
        });
    }

    loadFiles(src) {
        this.logger.info('Collect all files from %s', src);
        return glob(['*.js'], {cwd:src});
    }
}

module.exports = CollectCommand;
