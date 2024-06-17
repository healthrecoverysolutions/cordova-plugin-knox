export interface VersionInfo {
    knoxAppVersion: string;
}

export declare class KnoxCordovaInterface {
    constructor();
    isEnabled(): Promise<boolean>;
    shutdown(): Promise<void>;
    reboot(): Promise<void>;
    getVersionInfo(): Promise<VersionInfo>;
    getIMEI(): Promise<string>;
}
/**
 * Singleton reference to interact with this cordova plugin
 */
export declare const Knox: KnoxCordovaInterface;
