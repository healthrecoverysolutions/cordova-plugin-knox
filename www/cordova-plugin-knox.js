"use strict";
////////////////////////////////////////////////////////////////
// Generic Cordova Utilities
////////////////////////////////////////////////////////////////
Object.defineProperty(exports, "__esModule", { value: true });
exports.Knox = exports.KnoxCordovaInterface = void 0;
function noop() {
    return;
}
function cordovaExec(plugin, method, successCallback, errorCallback, args) {
    if (successCallback === void 0) { successCallback = noop; }
    if (errorCallback === void 0) { errorCallback = noop; }
    if (args === void 0) { args = []; }
    if (window.cordova) {
        window.cordova.exec(successCallback, errorCallback, plugin, method, args);
    }
    else {
        console.warn("".concat(plugin, ".").concat(method, "(...) :: cordova not available"));
        errorCallback && errorCallback("cordova_not_available");
    }
}
function cordovaExecPromise(plugin, method, args) {
    return new Promise(function (resolve, reject) {
        cordovaExec(plugin, method, resolve, reject, args);
    });
}
////////////////////////////////////////////////////////////////
// Plugin Interface
////////////////////////////////////////////////////////////////
var PLUGIN_NAME = 'KnoxPlugin';
function invoke(method) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return cordovaExecPromise(PLUGIN_NAME, method, args);
}
var KnoxCordovaInterface = /** @class */ (function () {
    function KnoxCordovaInterface() {
    }
    KnoxCordovaInterface.prototype.isEnabled = function () {
        return invoke('isEnabled')
            .then(function (v) { return !!(v === null || v === void 0 ? void 0 : v.enabled); });
    };
    KnoxCordovaInterface.prototype.shutdown = function () {
        return invoke('shutdown');
    };
    KnoxCordovaInterface.prototype.reboot = function () {
        return invoke('reboot');
    };
    return KnoxCordovaInterface;
}());
exports.KnoxCordovaInterface = KnoxCordovaInterface;
/**
 * Singleton reference to interact with this cordova plugin
 */
exports.Knox = new KnoxCordovaInterface();
