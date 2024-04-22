export declare class KnoxCordovaInterface {
    constructor();
    isEnabled(): Promise<boolean>;
}
/**
 * Singleton reference to interact with this cordova plugin
 */
export declare const Knox: KnoxCordovaInterface;
