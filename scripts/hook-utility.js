#!/usr/bin/env node

/*
Runs any dynamic configuration needed during
this plugin's prepare phase.
*/

const fs = require('fs');
const path = require('path');
const projectPaths = require('./project-paths');

const {
    KNOX_PLUGIN_FILE,
    KNOX_PLUGIN_ENABLED_FILE,
    KNOX_PLUGIN_DISABLED_FILE
} = projectPaths;

const PLUGIN_NAME = 'KnoxPlugin';

module.exports.PLUGIN_NAME = PLUGIN_NAME;

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

function loadKnoxEnabledStateFromConfigXml(configXmlPath) {
    const xmlData = fs.readFileSync(configXmlPath).toString();
    const preferencePattern = /<preference name="KnoxEnabled" value="([^"]+)"/gm;
    const matched = preferencePattern.exec(xmlData);
    const enabled = !matched || matched[1] === 'true'; // if no match, consider it enabled by default
    log(`loadKnoxEnabledStateFromConfigXml() enabled = ${enabled}`);
    return enabled;
}

module.exports.loadKnoxEnabledStateFromConfigXml = loadKnoxEnabledStateFromConfigXml;

function loadKnoxEnabledStateForProject(projectRoot) {
    const configXmlFile = path.resolve(projectRoot, `config.xml`);
    return loadKnoxEnabledStateFromConfigXml(configXmlFile);
}

module.exports.loadKnoxEnabledStateForProject = loadKnoxEnabledStateForProject;

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