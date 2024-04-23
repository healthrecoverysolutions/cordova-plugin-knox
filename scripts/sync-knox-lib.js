#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const projectPaths = require('./project-paths');
const {
    log,
    loadKnoxEnabledStateForProject,
    copyFile,
    removeFile
} = require('./hook-utility');

function resolveOutputSdkPath(projectRoot) {
    // TODO: account for capacitor output path
    return path.resolve(projectRoot, ...projectPaths.cordova.sdkFile);
}

function syncKnoxLib(projectRoot) {
    const knoxEnabled = loadKnoxEnabledStateForProject(projectRoot);
    const npmSdkFile = path.resolve(projectRoot, ...projectPaths.npm.sdkFile);
    const platformsSdkFile = resolveOutputSdkPath(projectRoot);
    const platformSdkFileExists = fs.existsSync(platformsSdkFile);

    if (knoxEnabled && !platformSdkFileExists) {
        copyFile(npmSdkFile, platformsSdkFile);

    } else if (!knoxEnabled && platformSdkFileExists) {
        removeFile(platformsSdkFile);
    }
}

function main(context) {
    log('sync-knox-source');
    const cdvRoot = context && context.opts && context.opts.projectRoot;
    const projectRoot = cdvRoot || process.cwd();
    syncKnoxLib(projectRoot);
}

module.exports = main;