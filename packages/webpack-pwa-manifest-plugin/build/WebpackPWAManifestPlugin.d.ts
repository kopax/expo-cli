import { ExpoConfig } from '@expo/config';
import webpack from 'webpack';
import { ManifestOptions, ManifestProps } from './WebpackPWAManifestPlugin.types';
/**
 * Generate a `manifest.json` for your PWA based on the `app.json`.
 * This plugin must be **after HtmlWebpackPlugin**.
 *
 * To test PWAs in chrome visit `chrome://flags#enable-desktop-pwas`
 */
export default class WebpackPWAManifest {
    assets: any;
    hasHTMLPlugin: boolean;
    manifest: ManifestOptions;
    expoConfig: ExpoConfig;
    options: any;
    HtmlWebpackPlugin: any;
    projectRoot: string;
    constructor(appJson: ExpoConfig, { noResources, filename, publicPath, HtmlWebpackPlugin, projectRoot }: ManifestProps);
    getManifest(): ManifestOptions;
    apply(compiler: webpack.Compiler): void;
}
export { WebpackPWAManifest };
