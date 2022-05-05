'use strict';

module.exports = core;

const path = require('path');
const semver = require('semver');
const colors = require('colors/safe');
const pathExists = require('path-exists');
const commander = require('commander');

const log = require('@neoneo-cli-dev/log');
const utils = require('@neoneo-cli-dev/utils');
const init = require('@neoneo-cli-dev/init');

const pkg = require('../package.json');
const constant = require('./const');

let args;
let config;
let userHome;

const program = new commander.Command();

async function core() {
    try {
        log.info('start to exec core');
        checkPkgVersion();
        checkNodeVersion();
        checkRoot();
        await checkUserHome();
        // checkInputArgs();
        await checkEnv();
        await checkGlobalUpdate();
        registerCommand();
        utils();
    } catch(e) {
        log.error(e.message);
    }
}

function registerCommand() {
    program
        .name(Object.keys(pkg.bin)[0])
        .usage('<command> [options]')
        .version(pkg.version)
        .option('-d, --debug', '开启调试模式', false);
    
    program
        .command('init [projectName]')
        .option('-f, --force', '强制初始化项目')
        .action(init);

    program.on('option:debug', () => {
        if (program.opts().debug) {
            process.env.LOG_LEVEL = 'verbose';
        } else {
            process.env.LOG_LEVEL = 'info';
        }
        log.level = process.env.LOG_LEVEL;
    });

    program.on('command:*', (obj) =>{
        const availableCommands = program.commands.map((cmd) => cmd.name());
        console.log(colors.red(`未知的命令:${obj[0]}`));
        if (availableCommands.length > 0) {
            console.log(colors.red(`可用的命令:${availableCommands.join(',')}`));
        }
    });

    program.parse(process.argv);

    if (program.args && program.args.length < 1) {
        program.outputHelp();
        console.log();
    }
}

async function checkGlobalUpdate() {
    const currentVersion = pkg.version;
    const npmName = pkg.name;
    const { getNpmSemverVersion } = require('@neoneo-cli-dev/get-npm-info');
    const latestVersion = await getNpmSemverVersion(currentVersion, npmName);
    if (latestVersion && semver.gt(latestVersion, currentVersion)) {
        log.warn('更新提示', `请手动更新 ${npmName} 到最新版本 ${latestVersion}`);
    }
}

async function checkEnv() {
    const dotenv = require('dotenv');
    const dotenvPath = path.resolve(userHome, '.env');
    if (await pathExists(dotenvPath)) {
        config = dotenv.config({
            path: dotenvPath,
        });
    }

    createDefaultConfig();
    log.verbose('环境变量', process.env.CLI_HOME_PATH);
}

function createDefaultConfig() {
    const cliConfig = {
        home: userHome,
    };
    if (process.env.CLI_HOME) {
        cliConfig.cliHome = path.join(userHome, process.env.CLI_HOME);
    } else {
        cliConfig.cliHome = path.join(userHome, constant.DEFAULT_CLI_HOME);
    }
    process.env.CLI_HOME_PATH = cliConfig.cliHome;
}

function checkInputArgs() {
    const minimist = require('minimist');
    args = minimist(process.argv.slice(2))
    checkArgs();
}

function checkArgs() {
    if (args.debug) {
        process.env.LOG_LEVEL = 'verbose';
    } else {
        process.env.LOG_LEVEL = 'info';
    }
    log.level = process.env.LOG_LEVEL;
}

async function checkUserHome() {
    userHome = require('os').homedir();
    if (!userHome || !await pathExists(userHome)) {
        throw new Error(colors.red('当前用户主目录不存在'));
    }
    log.notice('您的用户主目录:', userHome);
}

function checkRoot() {
    const rootCheck = require('root-check');
    rootCheck();
    log.notice('您的系统用户权限:', process.getuid());
};

function checkNodeVersion() {
    const currentVersion =  process.version;
    const lowestVersion = constant.LOWEST_NODE_VERSION;
    if (!semver.gte(currentVersion, lowestVersion)) {
        throw new Error(colors.red(`neoneo-cli-dev 需要安装 v${lowestVersion} 以上版本的 Node.js`));
    }
}

function checkPkgVersion() {
    log.notice('您正在使用的版本:', pkg.version);
}