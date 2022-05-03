'use strict';

module.exports = core;

const semver = require('semver');
const colors = require('colors/safe');
const pathExists = require('path-exists');

const log = require('@neoneo-cli-dev/log');
const utils = require('@neoneo-cli-dev/utils');

const pkg = require('../package.json');
const constant = require('./const');

let args;

function core() {
    try {
        log.info('start to exec core');
        checkPkgVersion();
        checkNodeVersion();
        checkRoot();
        checkUserHome();
        checkInputArgs();
        log.verbose('debug', 'test debug');
        utils();
    } catch(e) {
        log.error(e.message);
    }
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

function checkUserHome() {
    const userHome = require('os').homedir();
    if (!userHome || !pathExists(userHome)) {
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