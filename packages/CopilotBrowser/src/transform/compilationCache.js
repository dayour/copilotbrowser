"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheDir = void 0;
exports.installSourceMapSupport = installSourceMapSupport;
exports.getFromCompilationCache = getFromCompilationCache;
exports.serializeCompilationCache = serializeCompilationCache;
exports.addToCompilationCache = addToCompilationCache;
exports.startCollectingFileDeps = startCollectingFileDeps;
exports.stopCollectingFileDeps = stopCollectingFileDeps;
exports.currentFileDepsCollector = currentFileDepsCollector;
exports.setExternalDependencies = setExternalDependencies;
exports.fileDependenciesForTest = fileDependenciesForTest;
exports.collectAffectedTestFiles = collectAffectedTestFiles;
exports.affectedTestFiles = affectedTestFiles;
exports.internalDependenciesForTestFile = internalDependenciesForTestFile;
exports.dependenciesForTestFile = dependenciesForTestFile;
exports.belongsToNodeModules = belongsToNodeModules;
exports.getUserData = getUserData;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("@copilotbrowser/copilotbrowser/lib/utils");
const globals_1 = require("../common/globals");
const utilsBundle_1 = require("../utilsBundle");
// Assumptions for the compilation cache:
// - Files in the temp directory we work with can disappear at any moment, either some of them or all together.
// - Multiple workers can be trying to read from the compilation cache at the same time.
// - There is a single invocation of the test runner at a time.
//
// Therefore, we implement the following logic:
// - Never assume that file is present, always try to read it to determine whether it's actually present.
// - Never write to the cache from worker processes to avoid "multiple writers" races.
// - Since we perform all static imports in the runner beforehand, most of the time
//   workers should be able to read from the cache.
// - For workers-only dynamic imports or some cache problems, we will re-transpile files in
//   each worker anew.
exports.cacheDir = process.env.PWTEST_CACHE_DIR || (() => {
    if (process.platform === 'win32')
        return path_1.default.join(os_1.default.tmpdir(), `copilotbrowser-transform-cache`);
    // Use `geteuid()` instead of more natural `os.userInfo().username`
    // since `os.userInfo()` is not always available.
    // Note: `process.geteuid()` is not available on windows.
    // See https://github.com/dayour/copilotbrowser/issues/22721
    return path_1.default.join(os_1.default.tmpdir(), `copilotbrowser-transform-cache-` + process.geteuid?.());
})();
const sourceMaps = new Map();
const memoryCache = new Map();
// Dependencies resolved by the loader.
const fileDependencies = new Map();
// Dependencies resolved by the external bundler.
const externalDependencies = new Map();
function installSourceMapSupport() {
    Error.stackTraceLimit = 200;
    utilsBundle_1.sourceMapSupport.install({
        environment: 'node',
        handleUncaughtExceptions: false,
        retrieveSourceMap(source) {
            if (source.startsWith('file://') && !sourceMaps.has(source))
                source = source.substring('file://'.length);
            if (!sourceMaps.has(source))
                return null;
            const sourceMapPath = sourceMaps.get(source);
            try {
                return {
                    map: JSON.parse(fs_1.default.readFileSync(sourceMapPath, 'utf-8')),
                    url: source,
                };
            }
            catch {
                return null;
            }
        }
    });
}
function _innerAddToCompilationCacheAndSerialize(filename, entry) {
    sourceMaps.set(entry.moduleUrl || filename, entry.sourceMapPath);
    memoryCache.set(filename, entry);
    return {
        sourceMaps: [[entry.moduleUrl || filename, entry.sourceMapPath]],
        memoryCache: [[filename, entry]],
        fileDependencies: [],
        externalDependencies: [],
    };
}
function getFromCompilationCache(filename, contentHash, moduleUrl) {
    // First check the memory cache by filename, this cache will always work in the worker,
    // because we just compiled this file in the loader.
    const cache = memoryCache.get(filename);
    if (cache?.codePath) {
        try {
            return { cachedCode: fs_1.default.readFileSync(cache.codePath, 'utf-8') };
        }
        catch {
            // Not able to read the file - fall through.
        }
    }
    // Then do the disk cache, this cache works between the copilotbrowser Test runs.
    const filePathHash = calculateFilePathHash(filename);
    const hashPrefix = filePathHash + '_' + contentHash.substring(0, 7);
    const cacheFolderName = filePathHash.substring(0, 2);
    const cachePath = calculateCachePath(filename, cacheFolderName, hashPrefix);
    const codePath = cachePath + '.js';
    const sourceMapPath = cachePath + '.map';
    const dataPath = cachePath + '.data';
    try {
        const cachedCode = fs_1.default.readFileSync(codePath, 'utf8');
        const serializedCache = _innerAddToCompilationCacheAndSerialize(filename, { codePath, sourceMapPath, dataPath, moduleUrl });
        return { cachedCode, serializedCache };
    }
    catch {
    }
    return {
        addToCache: (code, map, data) => {
            if ((0, globals_1.isWorkerProcess)())
                return {};
            // Trim cache. This won't help with deleted files, but it will remove storing multiple copies of the same file
            clearOldCacheEntries(cacheFolderName, filePathHash);
            fs_1.default.mkdirSync(path_1.default.dirname(cachePath), { recursive: true });
            if (map)
                fs_1.default.writeFileSync(sourceMapPath, JSON.stringify(map), 'utf8');
            if (data.size)
                fs_1.default.writeFileSync(dataPath, JSON.stringify(Object.fromEntries(data.entries()), undefined, 2), 'utf8');
            fs_1.default.writeFileSync(codePath, code, 'utf8');
            const serializedCache = _innerAddToCompilationCacheAndSerialize(filename, { codePath, sourceMapPath, dataPath, moduleUrl });
            return { serializedCache };
        }
    };
}
function serializeCompilationCache() {
    return {
        sourceMaps: [...sourceMaps.entries()],
        memoryCache: [...memoryCache.entries()],
        fileDependencies: [...fileDependencies.entries()].map(([filename, deps]) => ([filename, [...deps]])),
        externalDependencies: [...externalDependencies.entries()].map(([filename, deps]) => ([filename, [...deps]])),
    };
}
function addToCompilationCache(payload) {
    for (const entry of payload.sourceMaps)
        sourceMaps.set(entry[0], entry[1]);
    for (const entry of payload.memoryCache)
        memoryCache.set(entry[0], entry[1]);
    for (const entry of payload.fileDependencies) {
        const existing = fileDependencies.get(entry[0]) || [];
        fileDependencies.set(entry[0], new Set([...entry[1], ...existing]));
    }
    for (const entry of payload.externalDependencies) {
        const existing = externalDependencies.get(entry[0]) || [];
        externalDependencies.set(entry[0], new Set([...entry[1], ...existing]));
    }
}
function calculateFilePathHash(filePath) {
    // Larger file path hash allows for fewer collisions compared to content, as we only check file path collision for deleting files
    return (0, utils_1.calculateSha1)(filePath).substring(0, 10);
}
function calculateCachePath(filePath, cacheFolderName, hashPrefix) {
    const fileName = hashPrefix + '_' + path_1.default.basename(filePath, path_1.default.extname(filePath)).replace(/\W/g, '');
    return path_1.default.join(exports.cacheDir, cacheFolderName, fileName);
}
function clearOldCacheEntries(cacheFolderName, filePathHash) {
    const cachePath = path_1.default.join(exports.cacheDir, cacheFolderName);
    try {
        const cachedRelevantFiles = fs_1.default.readdirSync(cachePath).filter(file => file.startsWith(filePathHash));
        for (const file of cachedRelevantFiles)
            fs_1.default.rmSync(path_1.default.join(cachePath, file), { force: true });
    }
    catch {
    }
}
// Since ESM and CJS collect dependencies differently,
// we go via the global state to collect them.
let depsCollector;
function startCollectingFileDeps() {
    depsCollector = new Set();
}
function stopCollectingFileDeps(filename) {
    if (!depsCollector)
        return;
    depsCollector.delete(filename);
    for (const dep of depsCollector) {
        if (belongsToNodeModules(dep))
            depsCollector.delete(dep);
    }
    fileDependencies.set(filename, depsCollector);
    depsCollector = undefined;
}
function currentFileDepsCollector() {
    return depsCollector;
}
function setExternalDependencies(filename, deps) {
    const depsSet = new Set(deps.filter(dep => !belongsToNodeModules(dep) && dep !== filename));
    externalDependencies.set(filename, depsSet);
}
function fileDependenciesForTest() {
    return fileDependencies;
}
function collectAffectedTestFiles(changedFile, testFileCollector) {
    const isTestFile = (file) => fileDependencies.has(file);
    if (isTestFile(changedFile))
        testFileCollector.add(changedFile);
    for (const [testFile, deps] of fileDependencies) {
        if (deps.has(changedFile))
            testFileCollector.add(testFile);
    }
    for (const [importingFile, depsOfImportingFile] of externalDependencies) {
        if (depsOfImportingFile.has(changedFile)) {
            if (isTestFile(importingFile))
                testFileCollector.add(importingFile);
            for (const [testFile, depsOfTestFile] of fileDependencies) {
                if (depsOfTestFile.has(importingFile))
                    testFileCollector.add(testFile);
            }
        }
    }
}
function affectedTestFiles(changes) {
    const result = new Set();
    for (const change of changes)
        collectAffectedTestFiles(change, result);
    return [...result];
}
function internalDependenciesForTestFile(filename) {
    return fileDependencies.get(filename);
}
function dependenciesForTestFile(filename) {
    const result = new Set();
    for (const testDependency of fileDependencies.get(filename) || []) {
        result.add(testDependency);
        for (const externalDependency of externalDependencies.get(testDependency) || [])
            result.add(externalDependency);
    }
    for (const dep of externalDependencies.get(filename) || [])
        result.add(dep);
    return result;
}
// This is only used in the dev mode, specifically excluding
// files from packages/copilotbrowser*. In production mode, node_modules covers
// that.
const kcopilotbrowserInternalPrefix = path_1.default.resolve(__dirname, '../../../copilotbrowser');
function belongsToNodeModules(file) {
    if (file.includes(`${path_1.default.sep}node_modules${path_1.default.sep}`))
        return true;
    if (file.startsWith(kcopilotbrowserInternalPrefix) && (file.endsWith('.js') || file.endsWith('.mjs')))
        return true;
    return false;
}
async function getUserData(pluginName) {
    const result = new Map();
    for (const [fileName, cache] of memoryCache) {
        if (!cache.dataPath)
            continue;
        if (!fs_1.default.existsSync(cache.dataPath))
            continue;
        const data = JSON.parse(await fs_1.default.promises.readFile(cache.dataPath, 'utf8'));
        if (data[pluginName])
            result.set(fileName, data[pluginName]);
    }
    return result;
}
