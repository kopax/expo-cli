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
const path_1 = __importDefault(require("path"));
const icons_1 = require("./icons");
const utils_1 = require("./utils");
const voidTags = [
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'keygen',
    'link',
    'menuitem',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
];
function createFilename(filenameTemplate, json, shouldFingerprint) {
    const formatters = [
        {
            pattern: /\[hash(:([1-9]|[1-2][0-9]|3[0-2]))?\]/gi,
            value: (substring, limit = ':32') => {
                if (!shouldFingerprint)
                    return '';
                const hash = utils_1.generateFingerprint(json);
                return hash.substr(0, parseInt(limit.substr(1), 10));
            },
        },
        {
            pattern: /\[ext\]/gi,
            value: 'json',
        },
        {
            pattern: /\[name\]/gi,
            value: 'manifest',
        },
    ];
    // @ts-ignore
    return formatters.reduce((acc, curr) => acc.replace(curr.pattern, curr.value), filenameTemplate);
}
// Create `manifest.json`
function writeManifestToFile(manifest, options, publicPath) {
    let content = Object.assign({}, manifest);
    if (content.orientation === 'omit') {
        delete content.orientation;
    }
    const json = JSON.stringify(content, null, 2);
    const file = path_1.default.parse(options.filename);
    const filename = createFilename(file.base, json, options.fingerprints);
    const output = options.includeDirectory ? path_1.default.join(file.dir, filename) : filename;
    return {
        output,
        url: utils_1.joinURI(publicPath, output),
        source: json,
        size: json.length,
    };
}
function buildResourcesAsync(self, publicPath = '') {
    return __awaiter(this, void 0, void 0, function* () {
        if (!self.assets || !self.options.inject) {
            let parsedIconsResult = {};
            if (!self.options.noResources) {
                const [results, config] = icons_1.retrieveIcons(self.manifest);
                self.manifest = config;
                parsedIconsResult = yield icons_1.parseIconsAsync(self.projectRoot, results, publicPath);
            }
            const { icons, assets = [] } = parsedIconsResult;
            const results = writeManifestToFile(Object.assign(Object.assign({}, self.manifest), { icons }), self.options, publicPath);
            self.assets = [results, ...assets];
            return results;
        }
        return null;
    });
}
exports.buildResourcesAsync = buildResourcesAsync;
function generateAppleSplashAndIconTags(assets) {
    let tags = {};
    for (let asset of assets) {
        if (asset.ios && asset.ios.valid) {
            if (asset.ios.valid === 'startup') {
                tags = applyTag(tags, 'link', {
                    rel: 'apple-touch-startup-image',
                    media: asset.ios.media,
                    href: asset.ios.href,
                });
            }
            else {
                tags = applyTag(tags, 'link', {
                    // apple-touch-icon-precomposed
                    rel: 'apple-touch-icon',
                    sizes: asset.ios.size,
                    href: asset.ios.href,
                });
            }
        }
    }
    return tags;
}
exports.generateAppleSplashAndIconTags = generateAppleSplashAndIconTags;
function applyTag(obj, tag, content) {
    if (!content) {
        return obj;
    }
    const current = obj[tag];
    if (current) {
        if (Array.isArray(current)) {
            return Object.assign(Object.assign({}, obj), { [tag]: [...current, content] });
        }
        return Object.assign(Object.assign({}, obj), { [tag]: [current, content] });
    }
    return Object.assign(Object.assign({}, obj), { [tag]: content });
}
exports.applyTag = applyTag;
function generateHtmlTags(tags) {
    let html = '';
    for (let tag in tags) {
        const attrs = tags[tag];
        if (Array.isArray(attrs)) {
            for (let a of attrs) {
                html = `${html}${generateHtmlTags({
                    [tag]: a,
                })}`;
            }
        }
        else {
            html = `${html}<${tag}`;
            for (let key of Object.keys(attrs)) {
                // @ts-ignore
                const attr = attrs[key];
                html = `${html} ${key}="${attr}"`;
            }
            html = voidTags.includes(tag) ? `${html} />` : `${html}></${tag}>`;
        }
    }
    return html;
}
exports.generateHtmlTags = generateHtmlTags;
//# sourceMappingURL=injector.js.map