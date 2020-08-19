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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const image_utils_1 = require("@expo/image-utils");
const fs_extra_1 = __importDefault(require("fs-extra"));
const mime_1 = __importDefault(require("mime"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const path_1 = __importDefault(require("path"));
const stream_1 = __importDefault(require("stream"));
const tempy_1 = __importDefault(require("tempy"));
const util_1 = __importDefault(require("util"));
const chalk_1 = __importDefault(require("chalk"));
const crypto_1 = __importDefault(require("crypto"));
const Errors_1 = require("./Errors");
const utils_1 = require("./utils");
const Apple_1 = require("./validators/Apple");
const ImageComposite_1 = require("./ImageComposite");
const supportedMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];
function sanitizeIcon(iconSnippet) {
    if (!iconSnippet.src) {
        throw new Errors_1.IconError('Unknown icon source.');
    }
    const sizes = utils_1.toArray(iconSnippet.size || iconSnippet.sizes);
    if (!sizes) {
        throw new Errors_1.IconError('Unknown icon sizes.');
    }
    return {
        src: iconSnippet.src,
        resizeMode: iconSnippet.resizeMode,
        sizes,
        media: iconSnippet.media,
        destination: iconSnippet.destination,
        ios: iconSnippet.ios,
        color: iconSnippet.color,
    };
}
function getBufferWithMimeAsync({ src, resizeMode, color }, mimeType, { width, height }) {
    return __awaiter(this, void 0, void 0, function* () {
        let imagePath;
        if (!supportedMimeTypes.includes(mimeType)) {
            imagePath = src;
        }
        else {
            let localSrc = src;
            // In case the icon is a remote URL we need to download it first
            if (src.startsWith('http')) {
                localSrc = yield downloadImage(src);
            }
            const imageData = yield resize(localSrc, mimeType, width, height, resizeMode, color);
            if (imageData instanceof Buffer) {
                return imageData;
            }
            else {
                imagePath = imageData;
            }
        }
        try {
            return yield fs_extra_1.default.readFile(imagePath);
        }
        catch (err) {
            throw new Errors_1.IconError(`It was not possible to read '${src}'.`);
        }
    });
}
function downloadImage(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const outputPath = tempy_1.default.directory();
        const localPath = path_1.default.join(outputPath, path_1.default.basename(url));
        const response = yield node_fetch_1.default(url);
        if (!response.ok) {
            throw new Errors_1.IconError(`It was not possible to download splash screen from '${url}'`);
        }
        // Download to local file
        const streamPipeline = util_1.default.promisify(stream_1.default.pipeline);
        yield streamPipeline(response.body, fs_extra_1.default.createWriteStream(localPath));
        return localPath;
    });
}
function ensureCacheDirectory(projectRoot, cacheKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const cacheFolder = path_1.default.join(projectRoot, '.expo/web/cache/production/images', cacheKey);
        yield fs_extra_1.default.ensureDir(cacheFolder);
        return cacheFolder;
    });
}
function getImageFromCacheAsync(fileName, cacheKey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield fs_extra_1.default.readFile(path_1.default.resolve(cacheKeys[cacheKey], fileName));
        }
        catch (_) {
            return null;
        }
    });
}
function cacheImageAsync(fileName, buffer, cacheKey) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs_extra_1.default.writeFile(path_1.default.resolve(cacheKeys[cacheKey], fileName), buffer);
        }
        catch ({ message }) {
            console.warn(`error caching image: "${fileName}". ${message}`);
        }
    });
}
let hasWarned = false;
function processImageAsync(size, icon, publicPath, cacheKey) {
    return __awaiter(this, void 0, void 0, function* () {
        const { width, height } = utils_1.toSize(size);
        if (width <= 0 || height <= 0) {
            throw Error(`Failed to process image with invalid size: { width: ${width}, height: ${height}}`);
        }
        const mimeType = mime_1.default.getType(icon.src);
        if (!mimeType) {
            throw new Error(`Invalid mimeType for image with source: ${icon.src}`);
        }
        const dimensions = `${width}x${height}`;
        const fileName = `icon_${dimensions}.${mime_1.default.getExtension(mimeType)}`;
        let imageBuffer = yield getImageFromCacheAsync(fileName, cacheKey);
        if (!imageBuffer) {
            // Putting the warning here will prevent the warning from showing if all images were reused from the cache
            if (!hasWarned && !(yield image_utils_1.isAvailableAsync())) {
                hasWarned = true;
                // TODO: Bacon: Fallback to nodejs image resizing as native doesn't work in the host environment.
                console.log('ff', cacheKey, fileName, dimensions);
                console.log();
                console.log(chalk_1.default.bgYellow.black(`PWA Images: Using node to generate images. This is much slower than using native packages.`));
                console.log(chalk_1.default.yellow(`- Optionally you can stop the process and try again after successfully running \`npm install -g sharp-cli\`.\n- If you are using \`expo-cli\` to build your project then you could use the \`--no-pwa\` flag to skip the PWA asset generation step entirely.`));
            }
            imageBuffer = yield getBufferWithMimeAsync(icon, mimeType, { width, height });
            yield cacheImageAsync(fileName, imageBuffer, cacheKey);
        }
        const iconOutputDir = icon.destination ? utils_1.joinURI(icon.destination, fileName) : fileName;
        const iconPublicUrl = utils_1.joinURI(publicPath, iconOutputDir);
        return {
            manifestIcon: {
                src: iconPublicUrl,
                sizes: dimensions,
                type: mimeType,
            },
            webpackAsset: {
                output: iconOutputDir,
                url: iconPublicUrl,
                source: imageBuffer,
                size: imageBuffer.length,
                ios: icon.ios
                    ? { valid: icon.ios, media: icon.media, size: dimensions, href: iconPublicUrl }
                    : false,
                resizeMode: icon.resizeMode,
                color: icon.color,
            },
        };
    });
}
function ensureValidMimeType(mimeType) {
    if (['input', 'jpeg', 'jpg', 'png', 'raw', 'tiff', 'webp'].includes(mimeType)) {
        return mimeType;
    }
    return 'png';
}
function resize(inputPath, mimeType, width, height, fit = 'contain', background) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield image_utils_1.isAvailableAsync())) {
            return yield ImageComposite_1.resize(inputPath, mimeType, width, height, fit, background);
        }
        const format = ensureValidMimeType(mimeType.split('/')[1]);
        const outputPath = tempy_1.default.directory();
        try {
            yield image_utils_1.sharpAsync({
                input: inputPath,
                output: outputPath,
                format,
            }, [
                {
                    operation: 'flatten',
                    background,
                },
                {
                    operation: 'resize',
                    width,
                    height,
                    fit,
                    background,
                },
            ]);
            return path_1.default.join(outputPath, path_1.default.basename(inputPath));
        }
        catch ({ message }) {
            throw new Errors_1.IconError(`It was not possible to generate splash screen '${inputPath}'. ${message}`);
        }
    });
}
function retrieveIcons(manifest) {
    // Remove these items so they aren't written to disk.
    const { startupImages, icons } = manifest, config = __rest(manifest, ["startupImages", "icons"]);
    const parsedStartupImages = utils_1.toArray(startupImages);
    let parsedIcons = utils_1.toArray(icons);
    if (parsedStartupImages.length) {
        // TODO: Bacon: use all of the startup images
        const startupImage = parsedStartupImages[0];
        parsedIcons = [...parsedIcons, ...Apple_1.fromStartupImage(startupImage)];
    }
    const response = parsedIcons.map(icon => sanitizeIcon(icon));
    return [response, config];
}
exports.retrieveIcons = retrieveIcons;
// Calculate SHA256 Checksum value of a file based on its contents
function calculateHash(filePath) {
    const contents = filePath.startsWith('http') ? filePath : fs_extra_1.default.readFileSync(filePath);
    return crypto_1.default
        .createHash('sha256')
        .update(contents)
        .digest('hex');
}
// Create a hash key for caching the images between builds
function createCacheKey(icon) {
    const hash = calculateHash(icon.src);
    return [hash, icon.resizeMode, icon.color].filter(Boolean).join('-');
}
const cacheKeys = {};
function parseIconsAsync(projectRoot, inputIcons, publicPath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!inputIcons.length) {
            return {};
        }
        const icons = [];
        const assets = [];
        let promises = [];
        for (const icon of inputIcons) {
            const cacheKey = createCacheKey(icon);
            if (!(cacheKey in cacheKeys)) {
                cacheKeys[cacheKey] = yield ensureCacheDirectory(projectRoot, cacheKey);
            }
            const { sizes } = icon;
            promises = [
                ...promises,
                ...sizes.map((size) => __awaiter(this, void 0, void 0, function* () {
                    const { manifestIcon, webpackAsset } = yield processImageAsync(size, icon, publicPath, cacheKey);
                    icons.push(manifestIcon);
                    assets.push(webpackAsset);
                })),
            ];
        }
        yield Promise.all(promises);
        yield clearUnusedCachesAsync(projectRoot);
        return {
            icons: sortByAttribute(icons, 'sizes'),
            // startupImages: icons.filter(({ isStartupImage }) => isStartupImage),
            assets: sortByAttribute(assets, 'output'),
        };
    });
}
exports.parseIconsAsync = parseIconsAsync;
function sortByAttribute(arr, key) {
    return arr.filter(Boolean).sort((valueA, valueB) => {
        if (valueA[key] < valueB[key])
            return -1;
        else if (valueA[key] > valueB[key])
            return 1;
        return 0;
    });
}
function clearUnusedCachesAsync(projectRoot) {
    return __awaiter(this, void 0, void 0, function* () {
        // Clean up any old caches
        const cacheFolder = path_1.default.join(projectRoot, '.expo/web/cache/production/images');
        const currentCaches = fs_extra_1.default.readdirSync(cacheFolder);
        if (!Array.isArray(currentCaches)) {
            console.warn('Failed to read the icon cache');
            return;
        }
        const deleteCachePromises = [];
        for (const cache of currentCaches) {
            // skip hidden folders
            if (cache.startsWith('.')) {
                continue;
            }
            // delete
            if (!(cache in cacheKeys)) {
                deleteCachePromises.push(fs_extra_1.default.remove(path_1.default.join(cacheFolder, cache)));
            }
        }
        yield Promise.all(deleteCachePromises);
    });
}
//# sourceMappingURL=icons.js.map