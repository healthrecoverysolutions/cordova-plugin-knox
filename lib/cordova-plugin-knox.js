////////////////////////////////////////////////////////////////
// Generic Cordova Utilities
////////////////////////////////////////////////////////////////
function noop() {
    return;
}
function cordovaExec(plugin, method, successCallback = noop, errorCallback = noop, args = []) {
    if (window.cordova) {
        window.cordova.exec(successCallback, errorCallback, plugin, method, args);
    }
    else {
        console.warn(`${plugin}.${method}(...) :: cordova not available`);
        errorCallback && errorCallback(`cordova_not_available`);
    }
}
function cordovaExecPromise(plugin, method, args) {
    return new Promise((resolve, reject) => {
        cordovaExec(plugin, method, resolve, reject, args);
    });
}
////////////////////////////////////////////////////////////////
// Plugin Interface
////////////////////////////////////////////////////////////////
const PLUGIN_NAME = 'KnoxPlugin';
function invoke(method, ...args) {
    return cordovaExecPromise(PLUGIN_NAME, method, args);
}
export class KnoxCordovaInterface {
    constructor() {
    }
    isEnabled() {
        return invoke('isEnabled')
            .then((v) => !!(v === null || v === void 0 ? void 0 : v.enabled));
    }
    shutdown() {
        return invoke('shutdown');
    }
    reboot() {
        return invoke('reboot');
    }
}
/**
 * Singleton reference to interact with this cordova plugin
 */
export const Knox = new KnoxCordovaInterface();
