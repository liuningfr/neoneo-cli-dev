'use strict';

module.exports = core;

const pkg = require('../package.json');
const log = require('@neoneo-cli-dev/log');
const utils = require('@neoneo-cli-dev/utils');

function core() {
    console.log('start to exec core');
    checkPkgVersion();
}

function checkPkgVersion() {
    // console.log(pkg.version);
    // log.success('test', 'success!');
    log.notice('您正在使用的版本:', pkg.version);
    utils();
}