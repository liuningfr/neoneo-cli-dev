'use strict';

module.exports = exec;

function exec() {
    console.log(process.env.CLI_TARGET_PATH, process.env.CLI_HOME_PATH);
}
