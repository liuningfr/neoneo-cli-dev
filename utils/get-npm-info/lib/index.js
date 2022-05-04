'use strict';

module.exports = {
    getNpmInfo,
    getNpmVersions,
    getNpmSemverVersion,
};

const axios = require('axios');
const urlJoin = require('url-join');
const semver = require('semver');

const log = require('@neoneo-cli-dev/log');

async function getNpmInfo(npmName, registry) {
    if (!npmName) {
        return null;
    }
    const registryUrl =  registry || getDefaultRegistry(true);
    const npmInfoUrl = urlJoin(registryUrl, npmName);
    try {
        const res = await axios.get(npmInfoUrl);
        if (res.status === 200) {
            return res.data;
        }
        return null;
    } catch(e) {
        log.error(e.message);
    }
}

async function getNpmVersions(npmName, registry) {
    const data = await getNpmInfo(npmName, registry);
    if (data) {
        return Object.keys(data.versions);
    } else {
        return [];
    }
}

function getSemverVersions(baseVersion, versions) {
    return versions.filter((version) => {
        return semver.satisfies(version, `>=${baseVersion}`);
    }).sort((a, b) => semver.gt(b, a));
}

async function getNpmSemverVersion(baseVersion, npmName, registry) {
    const versions = await getNpmVersions(npmName, registry);
    const newVersions = getSemverVersions(baseVersion, versions);
    if (newVersions && newVersions.length > 0) {
        return newVersions[0];
    }
    return newVersions;
}

function getDefaultRegistry(isOrigin = false) {
    return isOrigin ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org';
}
