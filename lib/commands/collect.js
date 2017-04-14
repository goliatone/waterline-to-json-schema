'use strict';


class CollectCommand {

    execute(event) {
        return this.loadFiles().then((files) => {

        }).catch((err) => {
            console.log(err.message);
            return err;
        });
    }
}

module.exports = CollectCommand;
