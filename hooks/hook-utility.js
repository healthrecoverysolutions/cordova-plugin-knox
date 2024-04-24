#!/usr/bin/env node

/*
Runs any dynamic configuration needed during
this plugin's prepare phase.
*/

const fs = require('fs');
const path = require('path');

const PLUGIN_NAME = 'KnoxPlugin';

function log(message, ...args) {
    console.log(`[${PLUGIN_NAME}] ${message}`, ...args);
}

module.exports.log = log;

function warn(message, ...args) {
    log(`WARN: ${message}`, ...args);
}

module.exports.warn = warn;

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

function loadPluginVariablesFromConfigXml(configXmlPath) {
    const xmlData = fs.readFileSync(configXmlPath).toString();
    let matched = null;

    const pluginEnabledPattern = /<preference name="KnoxManageEnabled" value="([^"]+)"/gm;
    matched = pluginEnabledPattern.exec(xmlData);
    const knoxManageEnabled = !matched || matched[1] === 'true'; // if no match, consider it enabled by default

    const useSupportLibPattern = /<preference name="UseKnoxManageSupportLib" value="([^"]+)"/gm;
    matched = useSupportLibPattern.exec(xmlData);
    const useKnoxManageSupportLib = !!matched && matched[1] === 'true'; // false by default

    const result = {
        knoxManageEnabled,
        useKnoxManageSupportLib
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
