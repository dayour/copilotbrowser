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
import type { Location } from '../../types/testReporter';
export type TransformConfig = {
    babelPlugins: [string, any?][];
    external: string[];
};
export declare function setTransformConfig(config: TransformConfig): void;
export declare function transformConfig(): TransformConfig;
export declare function setSingleTSConfig(value: string | undefined): void;
export declare function singleTSConfig(): string | undefined;
export declare function resolveHook(filename: string, specifier: string): string | undefined;
export declare function shouldTransform(filename: string): boolean;
export declare function setTransformData(pluginName: string, value: any): void;
export declare function transformHook(originalCode: string, filename: string, moduleUrl?: string): {
    code: string;
    serializedCache?: any;
};
export declare function requireOrImport(file: string): Promise<any>;
export declare function wrapFunctionWithLocation<A extends any[], R>(func: (location: Location, ...args: A) => R): (...args: A) => R;
