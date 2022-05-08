'use strict';

module.exports = exec;

const Package = require('@neoneo-cli-dev/package');
const log = require('@neoneo-cli-dev/log');

const SETTINGS = {
    init: '@neoneo-cli-dev/init',
};

function exec() {
    const targetPath = process.env.CLI_TARGET_PATH;
    const homePath = process.env.CLI_HOME_PATH;
    log.verbose('targetPath', targetPath);
    log.verbose('homePath', homePath);

    const cmdObj = arguments[arguments.length - 1];
    const cmdName = cmdObj.name();
    const packageName = SETTINGS[cmdName];
    const packageVersion = 'latest';

    const pkg = new Package({
        targetPath,
        packageName,
        packageVersion,
    });
    console.log(pkg);
}
