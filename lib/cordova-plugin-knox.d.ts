export interface VersionInfo {
    knoxAppVersion: string;
}

export interface IMEI {
    imei: string;
}

export declare class KnoxCordovaInterface {
    constructor();
    isEnabled(): Promise<boolean>;
    shutdown(): Promise<void>;
    reboot(): Promise<void>;
    getVersionInfo(): Promise<VersionInfo>;
    getIMEI(): Promise<IMEI>;
}
/**
 * Singleton reference to interact with this cordova plugin
 */
export declare const Knox: KnoxCordovaInterface;
