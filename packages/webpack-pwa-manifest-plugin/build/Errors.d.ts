export declare class NamedError extends Error {
    constructor(message: string);
}
export declare class IconError extends NamedError {
}
export declare class PresetError extends NamedError {
    constructor(key: string, value: string);
}
