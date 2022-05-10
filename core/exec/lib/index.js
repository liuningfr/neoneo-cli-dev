'use strict';

module.exports = exec;

const Package = require('@neoneo-cli-dev/package');
const log = require('@neoneo-cli-dev/log');
const path = require('path');

const SETTINGS = {
    init: '@neoneo-cli-dev/init',
};

const CACHE_DIR = 'dependencies';

async function exec() {
    let targetPath = process.env.CLI_TARGET_PATH;
    let storeDir = '';
    const homePath = process.env.CLI_HOME_PATH;
    let pkg;

    log.verbose('targetPath', targetPath);
    log.verbose('homePath', homePath);

    const cmdObj = arguments[arguments.length - 1];
    const cmdName = cmdObj.name();
    const packageName = SETTINGS[cmdName];
    const packageVersion = 'latest';

    if (!targetPath) {
        // 生成缓存路径;
        targetPath = path.resolve(homePath, CACHE_DIR);
        storeDir = path.resolve(targetPath, 'node_modules');
        log.verbose('targetPath', targetPath);
        log.verbose('storeDir', storeDir);
        pkg = new Package({
            targetPath,
            storeDir,
            packageName,
            packageVersion,
        });
        if (pkg.exists()) {
            pkg.update();
        } else {
            await pkg.install();
        }
    } else {
        pkg = new Package({
            targetPath,
            packageName,
            packageVersion,
        });
    }
    const rootFile = pkg.getRootFilePath();
    if(rootFile) {
        require(rootFile).apply(null, arguments);
    }
}
