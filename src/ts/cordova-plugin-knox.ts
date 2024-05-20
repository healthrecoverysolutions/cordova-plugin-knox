////////////////////////////////////////////////////////////////
// Generic Cordova Utilities
////////////////////////////////////////////////////////////////

type SuccessCallback<TValue> = (value: TValue) => void;
type ErrorCallback = (error: any) => void;

function noop() {
    return;
}

function cordovaExec<T>(
    plugin: string,
	method: string,
	successCallback: SuccessCallback<T> = noop,
	errorCallback: ErrorCallback = noop,
	args: any[] = [],
): void {
    if (window.cordova) {
        window.cordova.exec(successCallback, errorCallback, plugin, method, args);

    } else {
        console.warn(`${plugin}.${method}(...) :: cordova not available`);
        errorCallback && errorCallback(`cordova_not_available`);
    }
}

function cordovaExecPromise<T>(plugin: string, method: string, args?: any[]): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        cordovaExec<T>(plugin, method, resolve, reject, args);
    });
}

////////////////////////////////////////////////////////////////
// Plugin Interface
////////////////////////////////////////////////////////////////

const PLUGIN_NAME = 'KnoxPlugin';

function invoke<T>(method: string, ...args: any[]): Promise<T> {
    return cordovaExecPromise<T>(PLUGIN_NAME, method, args);
}

interface EnabledState {
    enabled: boolean;
}

export interface VersionInfo {
    knoxAppVersion: string;
}

export class KnoxCordovaInterface {

    constructor() {
    }

    public isEnabled(): Promise<boolean> {
        return invoke<EnabledState>('isEnabled')
            .then((v) => !!v?.enabled);
    }

    public shutdown(): Promise<void> {
        return invoke('shutdown');
    }

    public reboot(): Promise<void> {
        return invoke('reboot');
    }

    public getVersionInfo(): Promise<VersionInfo> {
        return invoke('getVersionInfo');
    }

    public getIMEI(): Promise<string> {
        return invoke('getIMEI');
    }
}

/**
 * Singleton reference to interact with this cordova plugin
 */
export const Knox = new KnoxCordovaInterface();