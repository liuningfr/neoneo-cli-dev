'use strict';

module.exports = exec;

const Package = require('@neoneo-cli-dev/package');
const log = require('@neoneo-cli-dev/log');
const path = require('path');
const cp = require('child_process');

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
            await pkg.update();
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
            const args = Array.from(arguments);
            const cmd = args[args.length - 1];
            const o = Object.create(null);
            Object.keys(cmd).forEach(key => {
                if(cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
                    o[key] = cmd[key];
                }
            });
            args[args.length - 1] = o;
            const code = `require('${rootFile}').call(null, ${JSON.stringify(args)})`;
            const child = cp.spawn('node', ['-e', code], {
                cwd: process.cwd(),
                stdio: 'inherit',
            });
            child.on('error', e => {
                log.error(e.message);
                process.exit(1);
            });
            child.on('exit', e => {
                log.verbose('init执行成功', e);
                process.exit(e);
            });
            // child.stdout.on('data', (chunk) => {
            //     console.log(chunk.toString());
            // });
            // child.stderr.on('data', (chunk) => {
            //     console.log(chunk.toString());
            // });
        } catch(e) {
            log.error(e.message)
        }
    }
}
