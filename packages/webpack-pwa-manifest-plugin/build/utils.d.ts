/// <reference types="node" />
import { BinaryLike } from 'crypto';
export declare function joinURI(...arr: string[]): string;
export declare function generateFingerprint(input: BinaryLike): string;
export declare const toNumber: (value: string | number) => number;
export declare function toSize(size: AnySize): ImageSize;
export interface ImageSize {
    width: number;
    height: number;
}
declare type SingleSize = string | number;
export declare type AnySize = ImageSize | SingleSize | SingleSize[];
export declare function toArray(i: any): any[];
export {};
