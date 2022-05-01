#!/usr/bin/env node

// const utils = require('@neoneo-cli-dev/utils');
// utils();
// console.log('hello neoneo-lib-dev!!');

const importLocal = require('import-local');

if (importLocal(__filename)) {
  require('npmlog').info('cli', '正在使用本地版本');
} else {
  require('../lib')(process.argv.slice(2));
}