#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const {
    log,
    loadPluginVariablesForProject,
    copyFile
} = require('./hook-utility');

const KNOX_PLUGIN_FILE =            'KnoxPlugin.kt';
const KNOX_PLUGIN_ENABLED_FILE =    'KnoxPluginEnabled.kt';
const KNOX_PLUGIN_DISABLED_FILE =   'KnoxPluginDisabled.kt';

const npmPluginSourceDir =          ['node_modules', 'cordova-plugin-knox', 'src', 'android'];
const cordovaPluginSourceDir =      ['platforms', 'android', 'app', 'src', 'main', 'java', 'com', 'hrs', 'knox'];

function copyPluginSourceFile(inputDir, outputDir, enabled) {
    const inputFile = enabled ? KNOX_PLUGIN_ENABLED_FILE : KNOX_PLUGIN_DISABLED_FILE;
    const inputPath = path.resolve(inputDir, inputFile);
    const outputPath = path.resolve(outputDir, KNOX_PLUGIN_FILE);
    copyFile(inputPath, outputPath);
}

function syncKnoxSource(projectRoot) {
    log('sync-knox-source');
    const {knoxManageEnabled} = loadPluginVariablesForProject(projectRoot);
    const inputDir = path.resolve(projectRoot, ...npmPluginSourceDir);
    const outputDir = path.resolve(projectRoot, ...cordovaPluginSourceDir);

    if (fs.existsSync(outputDir)) {
        copyPluginSourceFile(inputDir, outputDir, knoxManageEnabled);
    }
}

function main(context) {
    const cdvRoot = context && context.opts && context.opts.projectRoot;
    const projectRoot = cdvRoot || process.cwd();
    syncKnoxSource(projectRoot);
}

module.exports = main;