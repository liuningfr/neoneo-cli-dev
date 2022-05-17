'use strict';

const semver = require('semver');
const colors = require('colors/safe');

const LOWEST_NODE_VERSION = '12.0.0';

class Command {
    constructor(argv) {
        console.log('Command constructor');
        this._argv = argv;
        let runner = new Promise(() => {
            let chain = Promise.resolve();
            chain = chain.then(() => this.checkNodeVersion());
        });
    }

    checkNodeVersion() {
        const currentVersion =  process.version;
        const lowestVersion = LOWEST_NODE_VERSION;
        if (!semver.gte(currentVersion, lowestVersion)) {
            throw new Error(colors.red(`neoneo-cli-dev 需要安装 v${lowestVersion} 以上版本的 Node.js`));
        }
    }

    init() {
        throw new Error('init必须实现');
    }
    
    exec() {
        throw new Error('exec必须实现');
    }
}
module.exports = Command;
