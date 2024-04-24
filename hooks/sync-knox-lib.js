#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
    log,
    loadPluginVariablesForProject,
    copyFile,
    removeFile
} = require('./hook-utility');

const npmSdkFilePath =              ['node_modules', 'cordova-plugin-knox', 'src', 'android', 'libs', 'knoxsdk.jar'];
const npmSupportLibFilePath =       ['node_modules', 'cordova-plugin-knox', 'src', 'android', 'libs', 'supportlib.jar'];
const cordovaSdkFilePath =          ['platforms', 'android', 'app', 'libs', 'knoxsdk.jar'];
const cordovaSupportLibFilePath =   ['platforms', 'android', 'app', 'libs', 'supportlib.jar'];

function syncJarFile(inputPath, outputPath, enabled) {
    const outputExists = fs.existsSync(outputPath);

    if (enabled && !outputExists) {
        copyFile(inputPath, outputPath);

    } else if (!enabled && outputExists) {
        removeFile(outputPath);
    }
}

function syncKnoxLib(projectRoot) {
    log('sync-knox-lib');
    const {
        knoxManageEnabled, 
        useKnoxManageSupportLib
    } = loadPluginVariablesForProject(projectRoot);

    const sdkInputPath = path.resolve(projectRoot, ...npmSdkFilePath);
    const sdkOutputPath = path.resolve(projectRoot, ...cordovaSdkFilePath);
    syncJarFile(sdkInputPath, sdkOutputPath, knoxManageEnabled);

    const supportLibInputPath = path.resolve(projectRoot, ...npmSupportLibFilePath);
    const supportLibOutputPath = path.resolve(projectRoot, ...cordovaSupportLibFilePath);
    syncJarFile(supportLibInputPath, supportLibOutputPath, useKnoxManageSupportLib);
}

function main(context) {
    const cdvRoot = context && context.opts && context.opts.projectRoot;
    const projectRoot = cdvRoot || process.cwd();
    syncKnoxLib(projectRoot);
}

module.exports = main;