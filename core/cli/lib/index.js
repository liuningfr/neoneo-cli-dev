'use strict';

module.exports = core;

const pkg = require('../package.json');

function core() {
    console.log('start to exec core');
    checkPkgVersion();
}

function checkPkgVersion() {
    console.log(pkg.version);
}