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
        if (await pkg.exists()) {
            log.notice('开始更新');
            pkg.update();
        } else {
            log.notice('开始安装');
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
        try {
            require(rootFile).call(null, Array.from(arguments));
        } catch(e) {
            log.error(e.message)
        }
    }
}
