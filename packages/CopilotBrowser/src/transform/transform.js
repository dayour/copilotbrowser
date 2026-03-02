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
exports.setTransformConfig = setTransformConfig;
exports.transformConfig = transformConfig;
exports.setSingleTSConfig = setSingleTSConfig;
exports.singleTSConfig = singleTSConfig;
exports.resolveHook = resolveHook;
exports.shouldTransform = shouldTransform;
exports.setTransformData = setTransformData;
exports.transformHook = transformHook;
exports.requireOrImport = requireOrImport;
exports.wrapFunctionWithLocation = wrapFunctionWithLocation;
const fs_1 = __importDefault(require("fs"));
const module_1 = __importDefault(require("module"));
const path_1 = __importDefault(require("path"));
const url_1 = __importDefault(require("url"));
const crypto_1 = __importDefault(require("crypto"));
const tsconfig_loader_1 = require("../third_party/tsconfig-loader");
const util_1 = require("../util");
const utilsBundle_1 = require("../utilsBundle");
const compilationCache_1 = require("./compilationCache");
const pirates_1 = require("../third_party/pirates");
const md_1 = require("./md");
const version = require('../../package.json').version;
const cachedTSConfigs = new Map();
let _transformConfig = {
    babelPlugins: [],
    external: [],
};
let _externalMatcher = () => false;
function setTransformConfig(config) {
    _transformConfig = config;
    _externalMatcher = (0, util_1.createFileMatcher)(_transformConfig.external);
}
function transformConfig() {
    return _transformConfig;
}
let _singleTSConfigPath;
let _singleTSConfig;
function setSingleTSConfig(value) {
    _singleTSConfigPath = value;
}
function singleTSConfig() {
    return _singleTSConfigPath;
}
function validateTsConfig(tsconfig) {
    // When no explicit baseUrl is set, resolve paths relative to the tsconfig file.
    // See https://www.typescriptlang.org/tsconfig#paths
    const pathsBase = tsconfig.absoluteBaseUrl ?? tsconfig.paths?.pathsBasePath;
    // Only add the catch-all mapping when baseUrl is specified
    const pathsFallback = tsconfig.absoluteBaseUrl ? [{ key: '*', values: ['*'] }] : [];
    return {
        allowJs: !!tsconfig.allowJs,
        pathsBase,
        paths: Object.entries(tsconfig.paths?.mapping || {}).map(([key, values]) => ({ key, values })).concat(pathsFallback)
    };
}
function loadAndValidateTsconfigsForFile(file) {
    if (_singleTSConfigPath && !_singleTSConfig)
        _singleTSConfig = (0, tsconfig_loader_1.loadTsConfig)(_singleTSConfigPath).map(validateTsConfig);
    if (_singleTSConfig)
        return _singleTSConfig;
    return loadAndValidateTsconfigsForFolder(path_1.default.dirname(file));
}
function loadAndValidateTsconfigsForFolder(folder) {
    const foldersWithConfig = [];
    let currentFolder = path_1.default.resolve(folder);
    let result;
    while (true) {
        const cached = cachedTSConfigs.get(currentFolder);
        if (cached) {
            result = cached;
            break;
        }
        foldersWithConfig.push(currentFolder);
        for (const name of ['tsconfig.json', 'jsconfig.json']) {
            const configPath = path_1.default.join(currentFolder, name);
            if (fs_1.default.existsSync(configPath)) {
                const loaded = (0, tsconfig_loader_1.loadTsConfig)(configPath);
                result = loaded.map(validateTsConfig);
                break;
            }
        }
        if (result)
            break;
        const parentFolder = path_1.default.resolve(currentFolder, '../');
        if (currentFolder === parentFolder)
            break;
        currentFolder = parentFolder;
    }
    result = result || [];
    for (const folder of foldersWithConfig)
        cachedTSConfigs.set(folder, result);
    return result;
}
const pathSeparator = process.platform === 'win32' ? ';' : ':';
const builtins = new Set(module_1.default.builtinModules);
function resolveHook(filename, specifier) {
    if (specifier.startsWith('node:') || builtins.has(specifier))
        return;
    if (!shouldTransform(filename))
        return;
    if (isRelativeSpecifier(specifier))
        return (0, util_1.resolveImportSpecifierAfterMapping)(path_1.default.resolve(path_1.default.dirname(filename), specifier), false);
    /**
     * TypeScript discourages path-mapping into node_modules:
     * https://www.typescriptlang.org/docs/handbook/modules/reference.html#paths-should-not-point-to-monorepo-packages-or-node_modules-packages
     * However, if path-mapping doesn't yield a result, TypeScript falls back to the default resolution through node_modules.
     */
    const isTypeScript = filename.endsWith('.ts') || filename.endsWith('.tsx');
    const tsconfigs = loadAndValidateTsconfigsForFile(filename);
    for (const tsconfig of tsconfigs) {
        if (!isTypeScript && !tsconfig.allowJs)
            continue;
        let longestPrefixLength = -1;
        let pathMatchedByLongestPrefix;
        for (const { key, values } of tsconfig.paths) {
            let matchedPartOfSpecifier = specifier;
            const [keyPrefix, keySuffix] = key.split('*');
            if (key.includes('*')) {
                // * If pattern contains '*' then to match pattern "<prefix>*<suffix>" module name must start with the <prefix> and end with <suffix>.
                // * <MatchedStar> denotes part of the module name between <prefix> and <suffix>.
                // * If module name can be matches with multiple patterns then pattern with the longest prefix will be picked.
                // https://github.com/microsoft/TypeScript/blob/f82d0cb3299c04093e3835bc7e29f5b40475f586/src/compiler/moduleNameResolver.ts#L1049
                if (keyPrefix) {
                    if (!specifier.startsWith(keyPrefix))
                        continue;
                    matchedPartOfSpecifier = matchedPartOfSpecifier.substring(keyPrefix.length, matchedPartOfSpecifier.length);
                }
                if (keySuffix) {
                    if (!specifier.endsWith(keySuffix))
                        continue;
                    matchedPartOfSpecifier = matchedPartOfSpecifier.substring(0, matchedPartOfSpecifier.length - keySuffix.length);
                }
            }
            else {
                if (specifier !== key)
                    continue;
                matchedPartOfSpecifier = specifier;
            }
            if (keyPrefix.length <= longestPrefixLength)
                continue;
            for (const value of values) {
                let candidate = value;
                if (value.includes('*'))
                    candidate = candidate.replace('*', matchedPartOfSpecifier);
                candidate = path_1.default.resolve(tsconfig.pathsBase, candidate);
                const existing = (0, util_1.resolveImportSpecifierAfterMapping)(candidate, true);
                if (existing) {
                    longestPrefixLength = keyPrefix.length;
                    pathMatchedByLongestPrefix = existing;
                }
            }
        }
        if (pathMatchedByLongestPrefix)
            return pathMatchedByLongestPrefix;
    }
    if (path_1.default.isAbsolute(specifier)) {
        // Handle absolute file paths like `import '/path/to/file'`
        // Do not handle module imports like `import 'fs'`
        return (0, util_1.resolveImportSpecifierAfterMapping)(specifier, false);
    }
}
function shouldTransform(filename) {
    if (_externalMatcher(filename))
        return false;
    return !(0, compilationCache_1.belongsToNodeModules)(filename);
}
let transformData;
function setTransformData(pluginName, value) {
    transformData.set(pluginName, value);
}
function transformHook(originalCode, filename, moduleUrl) {
    // TODO: ideally, we would not transform before checking the cache. However, the source
    // currently depends on the seed.md, so "originalCode" is not enough to produce a cache key.
    let inputSourceMap;
    if (filename.endsWith('.md')) {
        const transformed = (0, md_1.transformMDToTS)(originalCode, filename);
        originalCode = transformed.code;
        inputSourceMap = transformed.map;
    }
    const hasPreprocessor = process.env.PW_TEST_SOURCE_TRANSFORM &&
        process.env.PW_TEST_SOURCE_TRANSFORM_SCOPE &&
        process.env.PW_TEST_SOURCE_TRANSFORM_SCOPE.split(pathSeparator).some(f => filename.startsWith(f));
    const pluginsPrologue = _transformConfig.babelPlugins;
    const pluginsEpilogue = hasPreprocessor ? [[process.env.PW_TEST_SOURCE_TRANSFORM]] : [];
    const hash = calculateHash(originalCode, filename, !!moduleUrl, pluginsPrologue, pluginsEpilogue);
    const { cachedCode, addToCache, serializedCache } = (0, compilationCache_1.getFromCompilationCache)(filename, hash, moduleUrl);
    if (cachedCode !== undefined)
        return { code: cachedCode, serializedCache };
    // We don't use any browserslist data, but babel checks it anyway.
    // Silence the annoying warning.
    process.env.BROWSERSLIST_IGNORE_OLD_DATA = 'true';
    const { babelTransform } = require('./babelBundle');
    transformData = new Map();
    const babelResult = babelTransform(originalCode, filename, !!moduleUrl, pluginsPrologue, pluginsEpilogue, inputSourceMap);
    if (!babelResult?.code)
        return { code: originalCode, serializedCache };
    const { code, map } = babelResult;
    const added = addToCache(code, map, transformData);
    return { code, serializedCache: added.serializedCache };
}
function calculateHash(content, filePath, isModule, pluginsPrologue, pluginsEpilogue) {
    const hash = crypto_1.default.createHash('sha1')
        .update(isModule ? 'esm' : 'no_esm')
        .update(content)
        .update(filePath)
        .update(version)
        .update(pluginsPrologue.map(p => p[0]).join(','))
        .update(pluginsEpilogue.map(p => p[0]).join(','))
        .digest('hex');
    return hash;
}
async function requireOrImport(file) {
    installTransformIfNeeded();
    const isModule = (0, util_1.fileIsModule)(file);
    if (isModule) {
        const fileName = url_1.default.pathToFileURL(file);
        const esmImport = () => eval(`import(${JSON.stringify(fileName)})`);
        // For ESM imports, issue a preflight to populate the compilation cache with the
        // source maps. This allows inline test() calls to resolve wrapFunctionWithLocation.
        await eval(`import(${JSON.stringify(fileName + '.esm.preflight')})`).finally(nextTask);
        // Compilation cache, which includes source maps, is populated in a post task.
        // When importing a module results in an error, the very next access to `error.stack`
        // will need source maps. To make sure source maps have arrived, we insert a task
        // that will be processed after compilation cache and guarantee that
        // source maps are available, before `error.stack` is accessed.
        return await esmImport().finally(nextTask);
    }
    const result = require(file);
    const depsCollector = (0, compilationCache_1.currentFileDepsCollector)();
    if (depsCollector) {
        const module = require.cache[file];
        if (module)
            collectCJSDependencies(module, depsCollector);
    }
    return result;
}
let transformInstalled = false;
function installTransformIfNeeded() {
    if (transformInstalled)
        return;
    transformInstalled = true;
    (0, compilationCache_1.installSourceMapSupport)();
    const originalResolveFilename = module_1.default._resolveFilename;
    function resolveFilename(specifier, parent, ...rest) {
        if (parent) {
            const resolved = resolveHook(parent.filename, specifier);
            if (resolved !== undefined)
                specifier = resolved;
        }
        return originalResolveFilename.call(this, specifier, parent, ...rest);
    }
    module_1.default._resolveFilename = resolveFilename;
    // Hopefully, one day we can migrate to synchronous loader hooks instead, similar to our esmLoader...
    (0, pirates_1.addHook)((code, filename) => {
        return transformHook(code, filename).code;
    }, shouldTransform, ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts', '.cjs', '.cts', '.md']);
}
const collectCJSDependencies = (module, dependencies) => {
    module.children.forEach(child => {
        if (!(0, compilationCache_1.belongsToNodeModules)(child.filename) && !dependencies.has(child.filename)) {
            dependencies.add(child.filename);
            collectCJSDependencies(child, dependencies);
        }
    });
};
function wrapFunctionWithLocation(func) {
    return (...args) => {
        const oldPrepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = (error, stackFrames) => {
            const frame = utilsBundle_1.sourceMapSupport.wrapCallSite(stackFrames[1]);
            const fileName = frame.getFileName();
            // Node error stacks for modules use file:// urls instead of paths.
            const file = (fileName && fileName.startsWith('file://')) ? url_1.default.fileURLToPath(fileName) : fileName;
            return {
                file,
                line: frame.getLineNumber(),
                column: frame.getColumnNumber(),
            };
        };
        const oldStackTraceLimit = Error.stackTraceLimit;
        Error.stackTraceLimit = 2;
        const obj = {};
        Error.captureStackTrace(obj);
        const location = obj.stack;
        Error.stackTraceLimit = oldStackTraceLimit;
        Error.prepareStackTrace = oldPrepareStackTrace;
        return func(location, ...args);
    };
}
function isRelativeSpecifier(specifier) {
    return specifier === '.' || specifier === '..' || specifier.startsWith('./') || specifier.startsWith('../');
}
async function nextTask() {
    return new Promise(resolve => setTimeout(resolve, 0));
}
