'use strict';

module.exports = exec;

const Package = require('@neoneo-cli-dev/package');

function exec() {
    const pkg = new Package();
    console.log(pkg);
    console.log(process.env.CLI_TARGET_PATH, process.env.CLI_HOME_PATH);
}
