"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const is_color_1 = __importDefault(require("is-color"));
const Errors_1 = require("./Errors");
const Presets_1 = __importDefault(require("./validators/Presets"));
function isObject(item) {
    return typeof item === 'object' && !Array.isArray(item) && item !== null;
}
function createPWAManifestFromExpoConfig(appJson) {
    if (!isObject(appJson)) {
        throw new Error('app.json must be an object');
    }
    const { web = {} } = appJson.expo || appJson || {};
    return {
        // PWA
        background_color: web.backgroundColor,
        description: web.description,
        dir: web.dir,
        display: web.display,
        lang: web.lang,
        name: web.name,
        orientation: web.orientation,
        prefer_related_applications: web.preferRelatedApplications,
        related_applications: web.relatedApplications,
        scope: web.scope,
        short_name: web.shortName,
        start_url: web.startUrl,
        theme_color: web.themeColor,
        crossorigin: web.crossorigin,
        startupImages: web.startupImages,
        icons: web.icons,
    };
}
exports.createPWAManifestFromExpoConfig = createPWAManifestFromExpoConfig;
function validateManifest(manifest) {
    if (!manifest)
        return;
    Presets_1.default(manifest, 'dir', 'display', 'orientation', 'crossorigin');
    for (const property of ['background_color', 'theme_color']) {
        // @ts-ignore
        const color = manifest[property];
        if (color && !is_color_1.default(color)) {
            throw new Errors_1.PresetError(property, color);
        }
    }
}
exports.validateManifest = validateManifest;
//# sourceMappingURL=config.js.map