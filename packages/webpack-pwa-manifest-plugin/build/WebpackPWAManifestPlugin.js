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
const config_1 = require("./config");
const createMetatagsFromConfig_1 = __importDefault(require("./createMetatagsFromConfig"));
const injector_1 = require("./injector");
const TAP_CMD = 'webpack-pwa-manifest-plugin';
const TAP = 'WebpackPWAManifestPlugin';
/**
 * Generate a `manifest.json` for your PWA based on the `app.json`.
 * This plugin must be **after HtmlWebpackPlugin**.
 *
 * To test PWAs in chrome visit `chrome://flags#enable-desktop-pwas`
 */
class WebpackPWAManifest {
    constructor(appJson, { noResources, filename, publicPath, HtmlWebpackPlugin, projectRoot }) {
        this.assets = null;
        this.hasHTMLPlugin = false;
        this.projectRoot = projectRoot || process.cwd();
        this.HtmlWebpackPlugin = HtmlWebpackPlugin;
        this.manifest = config_1.createPWAManifestFromExpoConfig(appJson);
        this.expoConfig = appJson;
        this.options = {
            fingerprints: true,
            inject: true,
            ios: false,
            publicPath,
            // filename: options.fingerprints ? '[name].[hash].[ext]' : '[name].[ext]',
            noResources,
            filename,
            includeDirectory: false,
            metatags: createMetatagsFromConfig_1.default(appJson),
        };
        if (noResources) {
            delete this.manifest.startupImages;
            delete this.manifest.icons;
        }
        config_1.validateManifest(this.manifest);
    }
    getManifest() {
        return this.manifest;
    }
    apply(compiler) {
        // Hook into the html-webpack-plugin processing
        // and add the html
        const injectToHTMLAsync = (htmlPluginData, compilation, callback) => __awaiter(this, void 0, void 0, function* () {
            if (!this.hasHTMLPlugin) {
                this.hasHTMLPlugin = true;
            }
            const publicPath = this.options.publicPath || compilation.outputOptions.publicPath;
            // The manifest (this.manifest) should be ready by this point.
            // It will be written to disk here.
            const manifestFile = yield injector_1.buildResourcesAsync(this, publicPath);
            if (!this.options.inject) {
                callback(null, htmlPluginData);
                return;
            }
            let tags = injector_1.generateAppleSplashAndIconTags(this.assets);
            for (const metatagName of Object.keys(this.options.metatags)) {
                const content = this.options.metatags[metatagName];
                tags = injector_1.applyTag(tags, 'meta', {
                    name: metatagName,
                    content,
                });
            }
            if (manifestFile) {
                const manifestLink = {
                    rel: 'manifest',
                    href: manifestFile.url,
                };
                if (this.manifest.crossorigin) {
                    manifestLink.crossorigin = this.manifest.crossorigin;
                }
                tags = injector_1.applyTag(tags, 'link', manifestLink);
            }
            const tagsHTML = injector_1.generateHtmlTags(tags);
            htmlPluginData.html = htmlPluginData.html.replace(/(<\/head>)/i, `${tagsHTML}</head>`);
            callback(null, htmlPluginData);
        });
        // webpack 4
        if (compiler.hooks) {
            compiler.hooks.compilation.tap(TAP, compilation => {
                // This is set in html-webpack-plugin pre-v4.
                // @ts-ignore
                let hook = compilation.hooks.htmlWebpackPluginAfterHtmlProcessing;
                if (!hook) {
                    const HtmlWebpackPlugin = this.HtmlWebpackPlugin || require('html-webpack-plugin');
                    hook = HtmlWebpackPlugin.getHooks(compilation).beforeEmit;
                }
                hook.tapAsync(TAP_CMD, (htmlPluginData, callback) => {
                    injectToHTMLAsync(htmlPluginData, compilation, () => {
                        if (this.assets) {
                            for (let asset of this.assets) {
                                compilation.assets[asset.output] = {
                                    source: () => asset.source,
                                    size: () => asset.size,
                                };
                            }
                        }
                        callback();
                    });
                });
            });
        }
        else {
            compiler.plugin('compilation', compilation => {
                compilation.plugin('html-webpack-plugin-before-html-processing', (htmlPluginData, callback) => injectToHTMLAsync(htmlPluginData, compilation, callback));
            });
        }
    }
}
exports.default = WebpackPWAManifest;
exports.WebpackPWAManifest = WebpackPWAManifest;
//# sourceMappingURL=WebpackPWAManifestPlugin.js.map