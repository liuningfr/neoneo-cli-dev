'use strict';

const fs = require('fs');
const path = require('path');
const Command = require('@neoneo-cli-dev/command');
const log = require('@neoneo-cli-dev/log');

class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || '';
        this.force = this._argv[1].force;
        log.verbose('projectName', this.projectName);
        log.verbose('force', this.force);
    }

    exec() {
        try {
            this.prepare()
            
        } catch (e) {
           log.error(e.message); 
        }
    }

    prepare() {
        if(!this.isCwdEmpty()) {

        } else {

        }
    }

    isCwdEmpty() {
        // or path.resolve('.')
        const localPath = process.cwd();
        let fileList = fs.readdirSync(localPath);
        fileList = fileList.filter((file) => (
            !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
        ));
        return !fileList || fileList.length === 0;
    }
}

function init(argv) {
    return new InitCommand(argv);
}

module.exports = init;
module.exports.InitCommand = InitCommand;
