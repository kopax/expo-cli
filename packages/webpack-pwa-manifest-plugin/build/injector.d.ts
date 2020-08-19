import { Icon, Tag, Tags } from './WebpackPWAManifestPlugin.types';
export declare function buildResourcesAsync(self: any, publicPath?: string): Promise<{
    output: string;
    url: string;
    source: string;
    size: number;
} | null>;
export declare function generateAppleSplashAndIconTags(assets: Icon[]): Tags;
export declare function applyTag(obj: Tags, tag: 'meta' | 'link', content?: Tag): Tags;
export declare function generateHtmlTags(tags: {
    [key: string]: Tag | Tag[];
}): string;
