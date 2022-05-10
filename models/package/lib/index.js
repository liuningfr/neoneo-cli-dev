'use strict';

const { isObject } = require('@neoneo-cli-dev/utils');
const pkgDir = require('pkg-dir').sync;
const path = require('path');
const formatPath = require('@neoneo-cli-dev/format-path');
const npminstall = require('npminstall');
const { getDefaultRegistry, getLatestVersion } = require('@neoneo-cli-dev/get-npm-info');
const pathExists = require('path-exists').sync;
class Package {
    constructor(options) {
        if (!options) {
            throw new Error('Package类的参数不能为空');
        }
        if (!isObject(options)) {
            throw new Error('Package类的参数必须是对象');
        }
        this.targetPath = options.targetPath;
        this.storeDir = options.storeDir;
        this.packageName = options.packageName;
        this.packageVersion = options.packageVersion;
        this.cacheFilePathPrefix = this.packageName.replace('/', '_');
    }

    async prepare() {
        if (this.packageVersion === 'latest') {
            this.packageVersion = await getLatestVersion(this.packageName);
        }
    }

    get cacheFilePath() {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`);
    }

    async exists() {
        if (this.storeDir) {
            await this.prepare();
            return pathExists(this.cacheFilePath);
        } else {
            return pathExists(this.targetPath);
        }
    }

    async install() {
        await this.prepare();
        return npminstall({
            root: this.targetPath,
            storeDir: this.storeDir,
            registry: getDefaultRegistry(),
            pkgs: [{
                name: this.packageName,
                version: this.packageVersion,
            }],
        });
    }

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

