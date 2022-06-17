'use strict';

module.exports = {
    isObject,
    spinnerStart,
    sleep,
    execAsync,
};

function isObject(o) {
    return Object.prototype.toString.call(o) === '[object Object]';  
}

function spinnerStart(msg, spinnerString = '|/-\\') {
    const Spinner = require('cli-spinner').Spinner;
 
    const spinner = new Spinner(msg + ' %s');
    spinner.setSpinnerString(spinnerString);
    spinner.start();
    return spinner;
}

function sleep (timeout = 1000) {
    return new Promise(resolve => setTimeout(resolve, timeout));
}

function execAsync (cmd, args, options) {
    return new Promise((resolve, reject) => {
        const p = require('child_process').spawn(cmd, args, options);
        p.on('error', e => {
            reject(e);
        });
        p.on('exit', e => {
            resolve(e);
        });
    });
}