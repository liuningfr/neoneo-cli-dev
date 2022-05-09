'use strict';

const { isObject } = require('@neoneo-cli-dev/utils');
const pkgDir = require('pkg-dir').sync;
const path = require('path');
const formatPath = require('@neoneo-cli-dev/format-path');
class Package {
    constructor(options) {
        if (!options) {
            throw new Error('Package类的参数不能为空');
        }
        if (!isObject(options)) {
            throw new Error('Package类的参数必须是对象');
        }
        this.targetPath = options.targetPath;
        this.packageName = options.packageName;
        this.packageVersion = options.packageVersion;
    }
    exists() {}

    install() {}

    update() {}

    getRootFilePath() {
        const dir = pkgDir(this.targetPath);
        if (dir) {
            const pkgFile = require(path.resolve(dir, 'package.json'));
            if (pkgFile && pkgFile.main) {
                return formatPath(path.resolve(dir, pkgFile.main));
            }
        }
        return null;
    }
}

module.exports = Package;

