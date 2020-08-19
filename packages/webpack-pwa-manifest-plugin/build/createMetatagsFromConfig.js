"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Metatags_1 = __importDefault(require("./Metatags"));
// @ts-ignore
function possibleProperty(input, possiblePropertyNames, fallback) {
    for (const propertyName of possiblePropertyNames) {
        if (input[propertyName] !== undefined) {
            return input[propertyName];
        }
    }
    return fallback;
}
// @ts-ignore
function populateMetatagObject(schema, input) {
    let output = {};
    for (const item of schema) {
        // Check the list of propNames and the tag name
        const value = possibleProperty(input, item.propNames.concat([item.name]), item.fallback);
        if (value !== undefined) {
            output[item.name] = value;
        }
    }
    return output;
}
function createMetatagsFromConfig(config = {}) {
    const { web = {} } = config;
    const { themeColor, meta = {} } = web;
    const { viewport, googleSiteVerification, apple = {}, twitter = {}, openGraph = {}, microsoft = {}, } = meta;
    const openGraphMetatags = populateMetatagObject(Metatags_1.default.openGraph, openGraph);
    const twitterMetatags = populateMetatagObject(Metatags_1.default.twitter, twitter);
    const microsoftMetatags = populateMetatagObject(Metatags_1.default.microsoft, microsoft);
    const appleMetatags = {
        // Disable automatic phone number detection.
        'format-detection': apple.formatDetection,
        'apple-touch-fullscreen': apple.touchFullscreen,
        'mobile-web-app-capable': apple.mobileWebAppCapable,
        'apple-mobile-web-app-capable': apple.mobileWebAppCapable,
        'apple-mobile-web-app-status-bar-style': apple.barStyle,
        'apple-mobile-web-app-title': web.shortName,
    };
    const metaTags = Object.assign(Object.assign(Object.assign(Object.assign({ viewport, description: config.description }, openGraphMetatags), microsoftMetatags), twitterMetatags), appleMetatags);
    if (googleSiteVerification !== undefined) {
        metaTags['google-site-verification'] = googleSiteVerification;
    }
    if (themeColor !== undefined) {
        metaTags['theme-color'] = themeColor;
    }
    return metaTags;
}
exports.default = createMetatagsFromConfig;
//# sourceMappingURL=createMetatagsFromConfig.js.map