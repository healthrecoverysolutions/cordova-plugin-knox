#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const {
    projectPaths,
    log,
    loadPluginVariablesForProject,
    copyFile,
    removeFile
} = require('./hook-utility');

function resolveOutputSdkPath(projectRoot) {
    // TODO: account for capacitor output path
    return path.resolve(projectRoot, ...projectPaths.cordova.sdkFile);
}

function resolveOutputSupportLibPath(projectRoot) {
    // TODO: account for capacitor output path
    return path.resolve(projectRoot, ...projectPaths.cordova.supportLibFile);
}

function syncJarFile(inputPath, outputPath, enabled) {
    const outputExists = fs.existsSync(outputPath);

    if (enabled && !outputExists) {
        copyFile(inputPath, outputPath);

    } else if (!enabled && outputExists) {
        removeFile(outputPath);
    }
}

function syncKnoxLib(projectRoot) {
    const {
        knoxManageEnabled, 
        useKnoxManageSupportLib
    } = loadPluginVariablesForProject(projectRoot);

    const npmSdkFile = path.resolve(projectRoot, ...projectPaths.npm.sdkFile);
    const platformsSdkFile = resolveOutputSdkPath(projectRoot);
    syncJarFile(npmSdkFile, platformsSdkFile, knoxManageEnabled);

    const npmSupportLibFile = path.resolve(projectRoot, ...projectPaths.npm.supportLibFile);
    const platformsSupportLibFile = resolveOutputSupportLibPath(projectRoot);
    syncJarFile(npmSupportLibFile, platformsSupportLibFile, useKnoxManageSupportLib);
}

function main(context) {
    log('sync-knox-lib');
    const cdvRoot = context && context.opts && context.opts.projectRoot;
    const projectRoot = cdvRoot || process.cwd();
    syncKnoxLib(projectRoot);
}

module.exports = main;