"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NamedError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
exports.NamedError = NamedError;
class IconError extends NamedError {
}
exports.IconError = IconError;
class PresetError extends NamedError {
    constructor(key, value) {
        super(`Unknown value of "${key}": ${value}`);
    }
}
exports.PresetError = PresetError;
//# sourceMappingURL=Errors.js.map