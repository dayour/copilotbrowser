/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { SdkObject } from './instrumentation';
import type * as dom from './dom';
import type { UtilityScript } from '@injected/utilityScript';
interface TaggedAsJSHandle<T> {
    __jshandle: T;
}
interface TaggedAsElementHandle<T> {
    __elementhandle: T;
}
type NoHandles<Arg> = Arg extends TaggedAsJSHandle<any> ? never : (Arg extends object ? {
    [Key in keyof Arg]: NoHandles<Arg[Key]>;
} : Arg);
type Unboxed<Arg> = Arg extends TaggedAsElementHandle<infer T> ? T : Arg extends TaggedAsJSHandle<infer T> ? T : Arg extends NoHandles<Arg> ? Arg : Arg extends [infer A0] ? [Unboxed<A0>] : Arg extends [infer A0, infer A1] ? [Unboxed<A0>, Unboxed<A1>] : Arg extends [infer A0, infer A1, infer A2] ? [Unboxed<A0>, Unboxed<A1>, Unboxed<A2>] : Arg extends Array<infer T> ? Array<Unboxed<T>> : Arg extends object ? {
    [Key in keyof Arg]: Unboxed<Arg[Key]>;
} : Arg;
export type Func0<R> = string | (() => R | Promise<R>);
export type Func1<Arg, R> = string | ((arg: Unboxed<Arg>) => R | Promise<R>);
export type FuncOn<On, Arg2, R> = string | ((on: On, arg2: Unboxed<Arg2>) => R | Promise<R>);
export type SmartHandle<T> = T extends Node ? dom.ElementHandle<T> : JSHandle<T>;
export interface ExecutionContextDelegate {
    rawEvaluateJSON(expression: string): Promise<any>;
    rawEvaluateHandle(context: ExecutionContext, expression: string): Promise<JSHandle>;
    evaluateWithArguments(expression: string, returnByValue: boolean, utilityScript: JSHandle, values: any[], handles: JSHandle[]): Promise<any>;
    getProperties(object: JSHandle): Promise<Map<string, JSHandle>>;
    releaseHandle(handle: JSHandle): Promise<void>;
}
export declare class ExecutionContext extends SdkObject {
    readonly delegate: ExecutionContextDelegate;
    private _utilityScriptPromise;
    private _contextDestroyedScope;
    readonly worldNameForTest: string;
    constructor(parent: SdkObject, delegate: ExecutionContextDelegate, worldNameForTest: string);
    contextDestroyed(reason: string): void;
    _raceAgainstContextDestroyed<T>(promise: Promise<T>): Promise<T>;
    rawEvaluateJSON(expression: string): Promise<any>;
    rawEvaluateHandle(expression: string): Promise<JSHandle>;
    evaluateWithArguments(expression: string, returnByValue: boolean, values: any[], handles: JSHandle[]): Promise<any>;
    getProperties(object: JSHandle): Promise<Map<string, JSHandle>>;
    releaseHandle(handle: JSHandle): Promise<void>;
    adoptIfNeeded(handle: JSHandle): Promise<JSHandle> | null;
    utilityScript(): Promise<JSHandle<UtilityScript>>;
    doSlowMo(): Promise<void>;
}
export declare class JSHandle<T = any> extends SdkObject {
    __jshandle: T;
    readonly _context: ExecutionContext;
    _disposed: boolean;
    readonly _objectId: string | undefined;
    readonly _value: any;
    private _objectType;
    protected _preview: string;
    private _previewCallback;
    constructor(context: ExecutionContext, type: string, preview: string | undefined, objectId?: string, value?: any);
    evaluate<R, Arg>(pageFunction: FuncOn<T, Arg, R>, arg?: Arg): Promise<R>;
    evaluateHandle<R, Arg>(pageFunction: FuncOn<T, Arg, R>, arg?: Arg): Promise<SmartHandle<R>>;
    evaluateExpression(expression: string, options: {
        isFunction?: boolean;
    }, arg: any): Promise<any>;
    evaluateExpressionHandle(expression: string, options: {
        isFunction?: boolean;
    }, arg: any): Promise<JSHandle<any>>;
    getProperty(propertyName: string): Promise<JSHandle>;
    getProperties(): Promise<Map<string, JSHandle>>;
    rawValue(): any;
    jsonValue(): Promise<T>;
    asElement(): dom.ElementHandle | null;
    dispose(): void;
    toString(): string;
    _setPreviewCallback(callback: (preview: string) => void): void;
    preview(): string;
    worldNameForTest(): string;
    _setPreview(preview: string): void;
}
export declare function evaluate(context: ExecutionContext, returnByValue: boolean, pageFunction: Function | string, ...args: any[]): Promise<any>;
export declare function evaluateExpression(context: ExecutionContext, expression: string, options: {
    returnByValue?: boolean;
    isFunction?: boolean;
}, ...args: any[]): Promise<any>;
export declare function parseUnserializableValue(unserializableValue: string): any;
export declare function normalizeEvaluationExpression(expression: string, isFunction: boolean | undefined): string;
export declare class JavaScriptErrorInEvaluate extends Error {
}
export declare function isJavaScriptErrorInEvaluate(error: Error): error is JavaScriptErrorInEvaluate;
export declare function sparseArrayToString(entries: {
    name: string;
    value?: any;
}[]): string;
export {};
