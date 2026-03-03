/**
 * @license
 * Copyright 2024 Google Inc.
 * Modifications copyright (c) Microsoft Corporation.
 * SPDX-License-Identifier: Apache-2.0
 */
import type * as Bidi from './bidiProtocol';
/**
 * @internal
 */
export declare class BidiSerializer {
    static serialize(arg: unknown): Bidi.Script.LocalValue;
    static _serializeNumber(arg: number): Bidi.Script.LocalValue;
    static _serializeObject(arg: object | null): Bidi.Script.LocalValue;
}
/**
 * @internal
 */
export declare const isPlainObject: (obj: unknown) => obj is Record<any, unknown>;
/**
 * @internal
 */
export declare const isRegExp: (obj: unknown) => obj is RegExp;
/**
 * @internal
 */
export declare const isDate: (obj: unknown) => obj is Date;
