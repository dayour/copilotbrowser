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
export type MemoryCache = {
    codePath: string;
    sourceMapPath: string;
    dataPath: string;
    moduleUrl?: string;
};
export type SerializedCompilationCache = {
    sourceMaps: [string, string][];
    memoryCache: [string, MemoryCache][];
    fileDependencies: [string, string[]][];
    externalDependencies: [string, string[]][];
};
export declare const cacheDir: string;
export declare function installSourceMapSupport(): void;
type CompilationCacheLookupResult = {
    serializedCache?: any;
    cachedCode?: string;
    addToCache?: (code: string, map: any | undefined | null, data: Map<string, any>) => {
        serializedCache?: any;
    };
};
export declare function getFromCompilationCache(filename: string, contentHash: string, moduleUrl?: string): CompilationCacheLookupResult;
export declare function serializeCompilationCache(): SerializedCompilationCache;
export declare function addToCompilationCache(payload: SerializedCompilationCache): void;
export declare function startCollectingFileDeps(): void;
export declare function stopCollectingFileDeps(filename: string): void;
export declare function currentFileDepsCollector(): Set<string> | undefined;
export declare function setExternalDependencies(filename: string, deps: string[]): void;
export declare function fileDependenciesForTest(): Map<string, Set<string>>;
export declare function collectAffectedTestFiles(changedFile: string, testFileCollector: Set<string>): void;
export declare function affectedTestFiles(changes: string[]): string[];
export declare function internalDependenciesForTestFile(filename: string): Set<string> | undefined;
export declare function dependenciesForTestFile(filename: string): Set<string>;
export declare function belongsToNodeModules(file: string): boolean;
export declare function getUserData(pluginName: string): Promise<Map<string, any>>;
export {};
