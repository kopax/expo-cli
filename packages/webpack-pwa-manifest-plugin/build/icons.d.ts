import { Icon, ManifestIcon, ManifestOptions } from './WebpackPWAManifestPlugin.types';
interface WebpackAsset {
    output: string;
    url: string;
    source: any;
    size: any;
    ios: boolean | {
        valid: any;
        media: any;
        size: string;
        href: string;
    };
    resizeMode: any;
    color: any;
}
export declare function retrieveIcons(manifest: ManifestOptions): [Icon[], ManifestOptions];
export declare function parseIconsAsync(projectRoot: string, inputIcons: Icon[], publicPath: string): Promise<{
    icons?: ManifestIcon[];
    assets?: WebpackAsset[];
}>;
export {};
