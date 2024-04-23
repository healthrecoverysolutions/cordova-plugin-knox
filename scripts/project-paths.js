#!/usr/bin/env node

const KNOX_PLUGIN_FILE = 'KnoxPlugin.kt';
const KNOX_PLUGIN_ENABLED_FILE = 'KnoxPluginEnabled.kt';
const KNOX_PLUGIN_DISABLED_FILE = 'KnoxPluginDisabled.kt';

module.exports = {
    KNOX_PLUGIN_FILE,
    KNOX_PLUGIN_ENABLED_FILE,
    KNOX_PLUGIN_DISABLED_FILE,
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