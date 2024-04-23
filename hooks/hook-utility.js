#!/usr/bin/env node

/*
Runs any dynamic configuration needed during
this plugin's prepare phase.
*/

const fs = require('fs');
const path = require('path');

const PLUGIN_NAME = 'KnoxPlugin';
const KNOX_PLUGIN_FILE = 'KnoxPlugin.kt';
const KNOX_PLUGIN_ENABLED_FILE = 'KnoxPluginEnabled.kt';
const KNOX_PLUGIN_DISABLED_FILE = 'KnoxPluginDisabled.kt';

module.exports.PLUGIN_NAME = PLUGIN_NAME;
module.exports.KNOX_PLUGIN_FILE = KNOX_PLUGIN_FILE;
module.exports.KNOX_PLUGIN_ENABLED_FILE = KNOX_PLUGIN_ENABLED_FILE;
module.exports.KNOX_PLUGIN_DISABLED_FILE = KNOX_PLUGIN_DISABLED_FILE;

const projectPaths = {
    npm: {
        pluginSourceDir: ['node_modules', 'cordova-plugin-knox', 'src', 'android'],
        sdkFile: ['node_modules', 'cordova-plugin-knox', 'src', 'android', 'libs', 'knoxsdk.jar'],
        supportLibFile: ['node_modules', 'cordova-plugin-knox', 'src', 'android', 'libs', 'supportlib.jar']
    },
    cordova: {
        pluginGradleDir: ['platforms', 'android', 'cordova-plugin-knox'],
        pluginSourceDir: ['platforms', 'android', 'app', 'src', 'main', 'java', 'com', 'hrs', 'knox'],
        sdkFile: ['platforms', 'android', 'app', 'libs', 'knoxsdk.jar'],
        supportLibFile: ['platforms', 'android', 'app', 'libs', 'supportlib.jar'],
    },
};

module.exports.projectPaths = projectPaths;

function log(message, ...args) {
    console.log(`[${PLUGIN_NAME}] ${message}`, ...args);
}

module.exports.log = log;

function warn(message, ...args) {
    log(`WARN: ${message}`, ...args);
}

module.exports.warn = warn;

function replaceInFile(filePath, replacers) {
    if (!fs.existsSync(filePath)) {
        warn(`replaceInFile() file does not exist at ${filePath}`);
        return;
    }

    if (!Array.isArray(replacers)) {
        warn(`replaceInFile() replacers is not an array`);
        return;
    }

    if (replacers.length <= 0) {
        warn(`replaceInFile() replacers array is empty`);
        return;
    }

    const input = fs.readFileSync(filePath).toString();
    let output = input;

    for (const {searchValue, replaceValue} of replacers) {
        output = output.replace(searchValue, replaceValue);
    }

    log(`replaceInFile() update file at ${filePath} with ${replacers.length} replacer(s)`);
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

module.exports.setKnoxGradleEnabled = setKnoxGradleEnabled;

function copyFile(source, dest) {
    log(`copyFile() ${source} -> ${dest}`);

    if (!fs.existsSync(source)) {
        log(`copyFile() ERROR: source does not exist`);
        return;
    }

    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        log(`copyFile() making directory intermediates for output path`);
        fs.mkdirSync(destDir, {recursive: true});
    }
    
    const data = fs.readFileSync(source);
    fs.writeFileSync(dest, data);
}

module.exports.copyFile = copyFile;

function removeFile(filePath) {
    log(`removeFile() ${filePath}`);
    fs.rmSync(filePath);
}

module.exports.removeFile = removeFile;

function syncKnoxPluginSource(inputDir, outputDir, enabled) {
    const inputFile = enabled ? KNOX_PLUGIN_ENABLED_FILE : KNOX_PLUGIN_DISABLED_FILE;
    const inputPath = path.resolve(inputDir, inputFile);
    const outputPath = path.resolve(outputDir, KNOX_PLUGIN_FILE);
    copyFile(inputPath, outputPath);
}

module.exports.syncKnoxPluginSource = syncKnoxPluginSource;

function loadPluginVariablesFromConfigXml(configXmlPath) {
    const xmlData = fs.readFileSync(configXmlPath).toString();
    let matched = null;

    const pluginEnabledPattern = /<preference name="KnoxManageEnabled" value="([^"]+)"/gm;
    matched = pluginEnabledPattern.exec(xmlData);
    const knoxManageEnabled = !matched || matched[1] === 'true'; // if no match, consider it enabled by default

    const supportLibEnabledPattern = /<preference name="KnoxManageSupportLibEnabled" value="([^"]+)"/gm;
    matched = supportLibEnabledPattern.exec(xmlData);
    const knoxManageSupportLibEnabled = !!matched && matched[1] === 'true'; // false by default

    const result = {
        knoxManageEnabled,
        knoxManageSupportLibEnabled
    };

    log(`loadPluginVariablesFromConfigXml()`, result);
    return result;
}

module.exports.loadPluginVariablesFromConfigXml = loadPluginVariablesFromConfigXml;

function loadPluginVariablesForProject(projectRoot) {
    const configXmlFile = path.resolve(projectRoot, `config.xml`);
    return loadPluginVariablesFromConfigXml(configXmlFile);
}

module.exports.loadPluginVariablesForProject = loadPluginVariablesForProject;

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

module.exports.findGradleFilePath = findGradleFilePath;