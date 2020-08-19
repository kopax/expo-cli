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
const jimp_1 = __importDefault(require("jimp"));
const Errors_1 = require("./Errors");
const ASPECT_FILL = 'cover';
const ASPECT_FIT = 'contain';
function createBaseImageAsync(width, height, color) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => new jimp_1.default(width, height, color, (err, image) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(image);
        }));
    });
}
function compositeImagesAsync(image, ...images) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const imageProps of images) {
            const childImage = yield jimp_1.default.read(imageProps);
            image.composite(childImage, 0, 0);
        }
        return image;
    });
}
function resize(inputPath, mimeType, width, height, fit = 'contain', background) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const initialImage = yield jimp_1.default.read(inputPath);
            const center = jimp_1.default.VERTICAL_ALIGN_MIDDLE | jimp_1.default.HORIZONTAL_ALIGN_CENTER;
            if (fit === ASPECT_FILL) {
                return yield initialImage
                    .cover(width, height, center)
                    .quality(100)
                    .getBufferAsync(mimeType);
            }
            else if (fit === ASPECT_FIT) {
                const resizedImage = yield initialImage.contain(width, height, center).quality(100);
                if (!background) {
                    return resizedImage.getBufferAsync(mimeType);
                }
                const splashScreen = yield createBaseImageAsync(width, height, background);
                const combinedImage = yield compositeImagesAsync(splashScreen, resizedImage);
                return combinedImage.getBufferAsync(mimeType);
            }
            else {
                throw new Errors_1.IconError(`Unsupported resize mode: ${fit}. Please choose either 'cover', or 'contain'`);
            }
        }
        catch ({ message }) {
            throw new Errors_1.IconError(`It was not possible to generate splash screen '${inputPath}'. ${message}`);
        }
    });
}
exports.resize = resize;
//# sourceMappingURL=ImageComposite.js.map