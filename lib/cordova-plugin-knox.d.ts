export declare class KnoxCordovaInterface {
    constructor();
    isEnabled(): Promise<boolean>;
    shutdown(): Promise<void>;
    reboot(): Promise<void>;
}
/**
 * Singleton reference to interact with this cordova plugin
 */
export declare const Knox: KnoxCordovaInterface;
