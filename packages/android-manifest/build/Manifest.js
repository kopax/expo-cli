"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const xml2js_1 = require("xml2js");
const os_1 = require("os");
const path_1 = __importDefault(require("path"));
const USES_PERMISSION = 'uses-permission';
function removePermissions(doc, permissionNames) {
    const targetNames = permissionNames ? permissionNames.map(ensurePermissionNameFormat) : null;
    const permissions = doc.manifest[USES_PERMISSION] || [];
    let nextPermissions = [];
    for (let attribute of permissions) {
        if (targetNames) {
            const value = attribute['$']['android:name'] || attribute['$']['name'];
            if (!targetNames.includes(value)) {
                nextPermissions.push(attribute);
            }
        }
    }
    doc.manifest[USES_PERMISSION] = nextPermissions;
}
exports.removePermissions = removePermissions;
// NOTE(brentvatne): it's unclear from the usage here what the expected return
// value should be. `any` is used to get past an error.
function addPermission(doc, permissionName) {
    const usesPermissions = doc.manifest[USES_PERMISSION] || [];
    usesPermissions.push({
        $: { 'android:name': permissionName },
    });
    doc.manifest[USES_PERMISSION] = usesPermissions;
}
exports.addPermission = addPermission;
function ensurePermissions(doc, permissionNames) {
    const permissions = getPermissions(doc);
    const results = {};
    for (const permissionName of permissionNames) {
        const targetName = ensurePermissionNameFormat(permissionName);
        if (!permissions.includes(targetName)) {
            addPermission(doc, targetName);
            results[permissionName] = true;
        }
        else {
            results[permissionName] = false;
        }
    }
    return results;
}
exports.ensurePermissions = ensurePermissions;
function ensurePermission(doc, permissionName) {
    const permissions = getPermissions(doc);
    const targetName = ensurePermissionNameFormat(permissionName);
    if (!permissions.includes(targetName)) {
        addPermission(doc, targetName);
        return true;
    }
    return false;
}
exports.ensurePermission = ensurePermission;
function ensurePermissionNameFormat(permissionName) {
    if (permissionName.includes('.')) {
        const com = permissionName.split('.');
        const name = com.pop();
        return [...com, name.toUpperCase()].join('.');
    }
    else {
        // If shorthand form like `WRITE_CONTACTS` is provided, expand it to `android.permission.WRITE_CONTACTS`.
        return ensurePermissionNameFormat(`android.permission.${permissionName}`);
    }
}
exports.ensurePermissionNameFormat = ensurePermissionNameFormat;
function getPermissionAttributes(doc) {
    return doc.manifest[USES_PERMISSION] || [];
}
exports.getPermissionAttributes = getPermissionAttributes;
function getPermissions(doc) {
    const usesPermissions = doc.manifest[USES_PERMISSION] || [];
    const permissions = usesPermissions.map(permissionObject => {
        return permissionObject['$']['android:name'] || permissionObject['$']['name'];
    });
    return permissions;
}
exports.getPermissions = getPermissions;
function logManifest(doc) {
    const builder = new xml2js_1.Builder();
    const xmlInput = builder.buildObject(doc);
    console.log(xmlInput);
}
exports.logManifest = logManifest;
const stringTimesN = (n, char) => Array(n + 1).join(char);
function format(manifest, { indentLevel = 2, newline = os_1.EOL } = {}) {
    let xmlInput;
    if (typeof manifest === 'string') {
        xmlInput = manifest;
    }
    else if (manifest.toString) {
        const builder = new xml2js_1.Builder({ headless: true });
        xmlInput = builder.buildObject(manifest);
        return xmlInput;
    }
    else {
        throw new Error(`@expo/android-manifest: invalid manifest value passed in: ${manifest}`);
    }
    const indentString = stringTimesN(indentLevel, ' ');
    let formatted = '';
    const regex = /(>)(<)(\/*)/g;
    const xml = xmlInput.replace(regex, `$1${newline}$2$3`);
    let pad = 0;
    xml
        .split(/\r?\n/)
        .map((line) => line.trim())
        .forEach((line) => {
        let indent = 0;
        if (line.match(/.+<\/\w[^>]*>$/)) {
            indent = 0;
        }
        else if (line.match(/^<\/\w/)) {
            // Somehow istanbul doesn't see the else case as covered, although it is. Skip it.
            /* istanbul ignore else  */
            if (pad !== 0) {
                pad -= 1;
            }
        }
        else if (line.match(/^<\w([^>]*[^\/])?>.*$/)) {
            indent = 1;
        }
        else {
            indent = 0;
        }
        const padding = stringTimesN(pad, indentString);
        formatted += padding + line + newline; // eslint-disable-line prefer-template
        pad += indent;
    });
    return formatted.trim();
}
exports.format = format;
function writeAndroidManifestAsync(manifestPath, manifest) {
    return __awaiter(this, void 0, void 0, function* () {
        const manifestXml = new xml2js_1.Builder().buildObject(manifest);
        yield fs_extra_1.default.ensureDir(path_1.default.dirname(manifestPath));
        yield fs_extra_1.default.writeFile(manifestPath, manifestXml);
    });
}
exports.writeAndroidManifestAsync = writeAndroidManifestAsync;
function getProjectAndroidManifestPathAsync(projectDir) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const shellPath = path_1.default.join(projectDir, 'android');
            if ((yield fs_extra_1.default.stat(shellPath)).isDirectory()) {
                const manifestPath = path_1.default.join(shellPath, 'app/src/main/AndroidManifest.xml');
                if ((yield fs_extra_1.default.stat(manifestPath)).isFile()) {
                    return manifestPath;
                }
            }
        }
        catch (error) { }
        return null;
    });
}
exports.getProjectAndroidManifestPathAsync = getProjectAndroidManifestPathAsync;
function readAsync(manifestPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const contents = yield fs_extra_1.default.readFile(manifestPath, { encoding: 'utf8', flag: 'r' });
        const parser = new xml2js_1.Parser();
        const manifest = parser.parseStringPromise(contents);
        return manifest;
    });
}
exports.readAsync = readAsync;
function persistAndroidPermissionsAsync(projectDir, permissions) {
    return __awaiter(this, void 0, void 0, function* () {
        const manifestPath = yield getProjectAndroidManifestPathAsync(projectDir);
        // The Android Manifest takes priority over the app.json
        if (!manifestPath) {
            return false;
        }
        const manifest = yield readAsync(manifestPath);
        removePermissions(manifest);
        const results = ensurePermissions(manifest, permissions);
        if (Object.values(results).reduce((prev, current) => prev && current, true) === false) {
            const failed = Object.keys(results).filter(key => !results[key]);
            throw new Error(`Failed to write the following permissions to the native AndroidManifest.xml: ${failed.join(', ')}`);
        }
        yield writeAndroidManifestAsync(manifestPath, manifest);
        return true;
    });
}
exports.persistAndroidPermissionsAsync = persistAndroidPermissionsAsync;
// TODO(Bacon): link to resources about required permission prompts
exports.UnimodulePermissions = {
    'android.permission.READ_INTERNAL_STORAGE': 'READ_INTERNAL_STORAGE',
    'android.permission.ACCESS_COARSE_LOCATION': 'ACCESS_COARSE_LOCATION',
    'android.permission.ACCESS_FINE_LOCATION': 'ACCESS_FINE_LOCATION',
    'android.permission.CAMERA': 'CAMERA',
    'android.permission.MANAGE_DOCUMENTS': 'MANAGE_DOCUMENTS',
    'android.permission.READ_CONTACTS': 'READ_CONTACTS',
    'android.permission.READ_CALENDAR': 'READ_CALENDAR',
    'android.permission.WRITE_CALENDAR': 'WRITE_CALENDAR',
    'android.permission.READ_EXTERNAL_STORAGE': 'READ_EXTERNAL_STORAGE',
    'android.permission.READ_PHONE_STATE': 'READ_PHONE_STATE',
    'android.permission.RECORD_AUDIO': 'RECORD_AUDIO',
    'android.permission.USE_FINGERPRINT': 'USE_FINGERPRINT',
    'android.permission.VIBRATE': 'VIBRATE',
    'android.permission.WAKE_LOCK': 'WAKE_LOCK',
    'android.permission.WRITE_EXTERNAL_STORAGE': 'WRITE_EXTERNAL_STORAGE',
    'com.anddoes.launcher.permission.UPDATE_COUNT': 'com.anddoes.launcher.permission.UPDATE_COUNT',
    'com.android.launcher.permission.INSTALL_SHORTCUT': 'com.android.launcher.permission.INSTALL_SHORTCUT',
    'com.google.android.c2dm.permission.RECEIVE': 'com.google.android.c2dm.permission.RECEIVE',
    'com.google.android.gms.permission.ACTIVITY_RECOGNITION': 'com.google.android.gms.permission.ACTIVITY_RECOGNITION',
    'com.google.android.providers.gsf.permission.READ_GSERVICES': 'com.google.android.providers.gsf.permission.READ_GSERVICES',
    'com.htc.launcher.permission.READ_SETTINGS': 'com.htc.launcher.permission.READ_SETTINGS',
    'com.htc.launcher.permission.UPDATE_SHORTCUT': 'com.htc.launcher.permission.UPDATE_SHORTCUT',
    'com.majeur.launcher.permission.UPDATE_BADGE': 'com.majeur.launcher.permission.UPDATE_BADGE',
    'com.sec.android.provider.badge.permission.READ': 'com.sec.android.provider.badge.permission.READ',
    'com.sec.android.provider.badge.permission.WRITE': 'com.sec.android.provider.badge.permission.WRITE',
    'com.sonyericsson.home.permission.BROADCAST_BADGE': 'com.sonyericsson.home.permission.BROADCAST_BADGE',
};
//# sourceMappingURL=Manifest.js.map