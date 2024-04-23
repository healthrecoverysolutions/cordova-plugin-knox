#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const projectPaths = require('./project-paths');
const {
    log,
    loadPluginVariablesForProject,
    syncKnoxPluginSource
} = require('./hook-utility');

function resolveOutputSourcePath(projectRoot) {
    // TODO: account for capacitor output path
    return path.resolve(projectRoot, ...projectPaths.cordova.pluginSourceDir);
}

function syncKnoxSource(projectRoot) {
    const {knoxManageEnabled} = loadPluginVariablesForProject(projectRoot);
    const nodeModulesSourceDir = path.resolve(projectRoot, ...projectPaths.npm.pluginSourceDir);
    const platformsSourceDir = resolveOutputSourcePath(projectRoot);

    if (fs.existsSync(platformsSourceDir)) {
        syncKnoxPluginSource(nodeModulesSourceDir, platformsSourceDir, knoxManageEnabled);
    }
}

function main(context) {
    log('sync-knox-source');
    const cdvRoot = context && context.opts && context.opts.projectRoot;
    const projectRoot = cdvRoot || process.cwd();
    syncKnoxSource(projectRoot);
}

module.exports = main;