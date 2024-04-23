#!/usr/bin/env node

/*
Runs any dynamic configuration needed during
this plugin's prepare phase.
*/

const fs = require('fs');
const path = require('path');

const PLUGIN_NAME = 'KnoxPlugin';
const PLUGIN_DIR_NAME = 'cordova-plugin-knox';
const KNOX_GRADLE_FILE = 'knox-plugin.gradle';
const KNOX_SDK_FILE = 'knoxsdk.jar';
const KNOX_PLUGIN_FILE = 'KnoxPlugin.kt';
const KNOX_PLUGIN_ENABLED_FILE = 'KnoxPluginEnabled.kt';
const KNOX_PLUGIN_DISABLED_FILE = 'KnoxPluginDisabled.kt';

function replaceInFile(filePath, replacers) {
    if (!fs.existsSync(filePath)) {
        console.log(`${PLUGIN_NAME} WARN: replaceInFile() file does not exist at ${filePath}`);
        return;
    }

    if (!Array.isArray(replacers)) {
        console.log(`${PLUGIN_NAME} WARN: replaceInFile() replacers is not an array`);
        return;
    }

    if (replacers.length <= 0) {
        console.log(`${PLUGIN_NAME} WARN: replaceInFile() replacers array is empty`);
        return;
    }

    const input = fs.readFileSync(filePath).toString();
    let output = input;

    for (const {searchValue, replaceValue} of replacers) {
        output = output.replace(searchValue, replaceValue);
    }

    console.log(`${PLUGIN_NAME} replaceInFile() update file at ${filePath} with ${replacers.length} replacer(s)`);
    fs.writeFileSync(filePath, output, 'utf8');
}

function setKnoxGradleEnabled(filePath, enabled) {
    replaceInFile(filePath, [
        {
            searchValue: /(def KNOX_ENABLED = )(true|false)/,
            replaceValue: `$1${!!enabled}`
        }
    ]);
}

function copyFile(source, dest, format) {
    console.log(`${PLUGIN_NAME} copyFile() ${source} -> ${dest}`);
    if (!format) format = 'utf8';
    const data = fs.readFileSync(source, format);
    fs.writeFileSync(dest, data, format);
}

function removeFile(filePath) {
    console.log(`${PLUGIN_NAME} removeFile() ${filePath}`);
    fs.rmSync(filePath);
}

function syncKnoxPluginSource(inputDir, outputDir, enabled) {
    const inputFile = enabled ? KNOX_PLUGIN_ENABLED_FILE : KNOX_PLUGIN_DISABLED_FILE;
    const inputPath = path.resolve(inputDir, inputFile);
    const outputPath = path.resolve(outputDir, KNOX_PLUGIN_FILE);
    copyFile(inputPath, outputPath);
}

function loadKnoxEnabledStateFromConfigXml(configXmlPath) {
    const xmlData = fs.readFileSync(configXmlPath).toString();
    const preferencePattern = /<preference name="KnoxEnabled" value="([^"]+)"/gm;
    const matched = preferencePattern.exec(xmlData);
    return !matched || matched[1] === 'true'; // if no match, consider it enabled by default
}

function findGradleFilePath(dirPath) {
    if (!fs.existsSync(dirPath)) {
        return null;
    }
    const entries = fs.readdirSync(dirPath, {withFileTypes: true});
    for (const entry of entries) {
        if (entry?.isFile() && entry.name?.endsWith('.gradle')) {
            return path.resolve(dirPath, entry.name);
        }
    }
}

function syncCordovaKnoxState(projectRoot) {
    const configXmlFile = path.resolve(projectRoot, `config.xml`);
    const nodeModulesPluginDir = path.resolve(projectRoot, `node_modules`, PLUGIN_DIR_NAME);
    const pluginsDir = path.resolve(projectRoot, `plugins`, PLUGIN_DIR_NAME, `src`, `android`);
    const platformsDir = path.resolve(projectRoot, `platforms`, `android`);

    const nodeModulesSourceDir = path.resolve(nodeModulesPluginDir, `src`, `android`);
    const platformsSourceDir = path.resolve(platformsDir, `app`, `src`, `main`, `java`, `com`, `hrs`, `knox`);
    const platformsGradleDir = path.resolve(platformsDir, PLUGIN_DIR_NAME);
    const platformsLibsDir = path.resolve(platformsDir, `app`, `libs`);
    const nodeModulesLibsDir = path.resolve(nodeModulesSourceDir, `libs`);

    const nodeModulesSdkFile = path.resolve(nodeModulesLibsDir, KNOX_SDK_FILE);
    const pluginsGradleFile = path.resolve(pluginsDir, KNOX_GRADLE_FILE);
    const platformsSdkFile = path.resolve(platformsLibsDir, KNOX_SDK_FILE);
    const platformsGradleFile = findGradleFilePath(platformsGradleDir);

    const knoxEnabled = loadKnoxEnabledStateFromConfigXml(configXmlFile);
    console.log(`${PLUGIN_NAME} sync knox enabled state = ${knoxEnabled}`);

    // sync gradle file in `plugins` directory
    if (fs.existsSync(pluginsGradleFile)) {
        setKnoxGradleEnabled(pluginsGradleFile, knoxEnabled);
    }

    // sync source file in `plugins` directory
    if (fs.existsSync(pluginsDir)) {
        syncKnoxPluginSource(nodeModulesSourceDir, pluginsDir, knoxEnabled);
    }

    // sync gradle file in `platforms` directory
    if (platformsGradleFile && fs.existsSync(platformsGradleFile)) {
        setKnoxGradleEnabled(platformsGradleFile, knoxEnabled);
    }

    // sync source file in `platforms` directory
    if (fs.existsSync(platformsSourceDir)) {
        syncKnoxPluginSource(nodeModulesSourceDir, platformsSourceDir, knoxEnabled);
    }

    const platformSdkFileExists = fs.existsSync(platformsSdkFile);

    // copy jar files into `platforms` if needed
    if (knoxEnabled && !platformSdkFileExists) {
        copyFile(nodeModulesSdkFile, platformsSdkFile);

    // delete jar files from `platforms` if needed
    } else if (!knoxEnabled && platformSdkFileExists) {
        removeFile(platformsSdkFile);
    }
}

function main(context) {
    const cdvRoot = context && context.opts && context.opts.projectRoot;
    const projectRoot = cdvRoot || process.cwd();
    syncCordovaKnoxState(projectRoot);
}

module.exports = main;