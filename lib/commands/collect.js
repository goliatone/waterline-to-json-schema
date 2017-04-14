'use strict';

const extend = require('gextend');
const glob = require('globby');

class CollectCommand {

    constructor(options = {}) {
        extend(this, options)
    }

    execute(event) {
        return this.loadFiles(event.source).then((files) => {
            this.logger.warn('Parse models :)', files);
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
