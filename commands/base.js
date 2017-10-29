'use strict';
const extend = require('gextend');
// const Paths = require('../lib/cli-paths');
const ChildProcess = require('child-process-promise');

class BaseCommand {

    constructor(options){
        this.logger = options.logger || console;
        // this.paths = new Paths();
    }

    execute(args){
        return new Promise((resolve, reject)=>{
            reject('Not implemented');
        });
    }

    ready(){
        if(this.useSudo) {
            if(process.env.USER !== 'root'){
                this.error('This command must run via sudo.');
            } else if(!process.env.SUDO_USER || process.env.USER === process.env.SUDO_USER) {
                this.error('This command must run via sudo, not as root.');
            }
        } else if(process.env.USER === 'root') {
            this.error('This command cant be run as root.');
        }

        return this;
    }

    commandExists(command){
        return ChildProcess.exec(`/usr/bin/which ${command}`)
            .then(() => true)
            .catch(() => false);
    }

    exec(command, options){
        if(this.dryRun){
            return this.logger.info(command, options);
        }
        return ChildProcess.exec(command, options);
    }

    execAsUser(command, options){
        if(process.env.USER !== 'root'){
            return this.exec(command, options);
        }

        return this.exec(`sudo -u "${process.env.SUDO_USER}" ${command}`, options);
    }

    error(msg, code=1){
        this.logger.error(msg);
        process.exit(code);
    }

    get useSudo(){
        return !!this._sudo;
    }

    set useSudo(v){
        this._sudo = v;
    }

    get dryRun(){
        return !!this._dryRun;
    }

    set dryRun(v){
        this._dryRun = v;
    }

    static attach(prog, namespace=false){
        const name = (namespace ? namespace + ' ' : '') + this.COMMAND_NAME; 
        
        const cmd = prog.command(name, this.DESCRIPTION);

        this.describe(prog, cmd);
        
        this.runner(cmd);
    }

    static describe(prog, cmd){}

    static runner(cmd){
        
        const Command = this;

        cmd.action((args, options, logger) => {
            const command = new Command({
                logger: logger
            });

            args.options = options;

            command.ready()
                .execute(args)
                .then((context) => {
                    process.exit(0);
                })
                .catch(logger.error);
        });
    }
}

module.exports = BaseCommand;
