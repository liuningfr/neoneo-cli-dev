'use strict';

const { isObject } = require('@neoneo-cli-dev/utils'); 
class Package {
    constructor(options) {
        if (!options) {
            throw new Error('Package类的参数不能为空');
        }
        if (!isObject(options)) {
            throw new Error('Package类的参数必须是对象');
        }
        this.targetPath = options.targetPath;
        this.storePath = options.storePath;
        this.packageName = options.packageName;
        this.packageVersion = options.packageVersion;
    }
    exists() {}

    install() {}

    update() {}

    getRootFilePath() {}
}

module.exports = Package;

