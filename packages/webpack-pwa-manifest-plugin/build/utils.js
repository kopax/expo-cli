"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
function joinURI(...arr) {
    const first = arr[0] || '';
    const join = arr.join('/');
    return normalizeURI(join[0] === '/' && first[0] !== '/' ? join.substring(1) : join);
}
exports.joinURI = joinURI;
function normalizeURI(uri) {
    return uri.replace(/(:\/\/)|(\\+|\/{2,})+/g, match => (match === '://' ? '://' : '/'));
}
function generateFingerprint(input) {
    return crypto_1.default
        .createHash('md5')
        .update(input)
        .digest('hex');
}
exports.generateFingerprint = generateFingerprint;
exports.toNumber = (value) => {
    if (typeof value === 'string') {
        return parseInt(value);
    }
    return value;
};
function toSize(size) {
    let width;
    let height;
    if (Array.isArray(size)) {
        if (size.length) {
            // [0, 0] || [0]
            width = exports.toNumber(size[0]);
            height = size.length > 1 ? exports.toNumber(size[1]) : width;
        }
        else {
            throw new Error('Failed to parse size: ' + size);
        }
    }
    else if (typeof size === 'number') {
        // 0
        width = size;
        height = size;
    }
    else if (typeof size === 'string') {
        // '0x0'
        const dimensions = size.split('x');
        width = exports.toNumber(dimensions[0]);
        height = exports.toNumber(dimensions[1]);
    }
    else if (typeof size.width !== 'undefined' && typeof size.height !== 'undefined') {
        width = exports.toNumber(size.width);
        height = exports.toNumber(size.height);
    }
    else {
        throw new Error('Failed to parse size: ' + size);
    }
    return { width, height };
}
exports.toSize = toSize;
function toArray(i) {
    if (i == null)
        return [];
    return i && !Array.isArray(i) ? [i] : i;
}
exports.toArray = toArray;
//# sourceMappingURL=utils.js.map