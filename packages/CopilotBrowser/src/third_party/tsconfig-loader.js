"use strict";
/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Jonas Kello
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadTsConfig = loadTsConfig;
/* eslint-disable */
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const utilsBundle_1 = require("../utilsBundle");
function loadTsConfig(configPath) {
    try {
        const references = [];
        const config = innerLoadTsConfig(configPath, references);
        return [config, ...references];
    }
    catch (e) {
        throw new Error(`Failed to load tsconfig file at ${configPath}:\n${e.message}`);
    }
}
function resolveConfigFile(baseConfigFile, referencedConfigFile) {
    if (!referencedConfigFile.endsWith('.json'))
        referencedConfigFile += '.json';
    const currentDir = path_1.default.dirname(baseConfigFile);
    let resolvedConfigFile = path_1.default.resolve(currentDir, referencedConfigFile);
    // TODO: I don't see how this makes sense, delete in the next minor release.
    if (referencedConfigFile.includes('/') && referencedConfigFile.includes('.') && !fs_1.default.existsSync(resolvedConfigFile))
        resolvedConfigFile = path_1.default.join(currentDir, 'node_modules', referencedConfigFile);
    return resolvedConfigFile;
}
function innerLoadTsConfig(configFilePath, references, visited = new Map()) {
    if (visited.has(configFilePath))
        return visited.get(configFilePath);
    let result = {
        tsConfigPath: configFilePath,
    };
    // Retain result instance below, so that caching works.
    visited.set(configFilePath, result);
    if (!fs_1.default.existsSync(configFilePath))
        return result;
    const configString = fs_1.default.readFileSync(configFilePath, 'utf-8');
    const cleanedJson = StripBom(configString);
    const parsedConfig = utilsBundle_1.json5.parse(cleanedJson);
    const extendsArray = Array.isArray(parsedConfig.extends) ? parsedConfig.extends : (parsedConfig.extends ? [parsedConfig.extends] : []);
    for (const extendedConfig of extendsArray) {
        const extendedConfigPath = resolveConfigFile(configFilePath, extendedConfig);
        const base = innerLoadTsConfig(extendedConfigPath, references, visited);
        // Retain result instance, so that caching works.
        Object.assign(result, base, { tsConfigPath: configFilePath });
    }
    if (parsedConfig.compilerOptions?.allowJs !== undefined)
        result.allowJs = parsedConfig.compilerOptions.allowJs;
    if (parsedConfig.compilerOptions?.paths !== undefined) {
        // We must store pathsBasePath from the config that defines "paths" and later resolve
        // based on this absolute path, when no "baseUrl" is specified. See tsc for reference:
        // https://github.com/microsoft/TypeScript/blob/353ccb7688351ae33ccf6e0acb913aa30621eaf4/src/compiler/commandLineParser.ts#L3129
        // https://github.com/microsoft/TypeScript/blob/353ccb7688351ae33ccf6e0acb913aa30621eaf4/src/compiler/moduleSpecifiers.ts#L510
        result.paths = {
            mapping: parsedConfig.compilerOptions.paths,
            pathsBasePath: path_1.default.dirname(configFilePath),
        };
    }
    if (parsedConfig.compilerOptions?.baseUrl !== undefined) {
        // Follow tsc and resolve all relative file paths in the config right away.
        // This way it is safe to inherit paths between the configs.
        result.absoluteBaseUrl = path_1.default.resolve(path_1.default.dirname(configFilePath), parsedConfig.compilerOptions.baseUrl);
    }
    for (const ref of parsedConfig.references || [])
        references.push(innerLoadTsConfig(resolveConfigFile(configFilePath, ref.path), references, visited));
    if (path_1.default.basename(configFilePath) === 'jsconfig.json' && result.allowJs === undefined)
        result.allowJs = true;
    return result;
}
function StripBom(string) {
    if (typeof string !== 'string') {
        throw new TypeError(`Expected a string, got ${typeof string}`);
    }
    // Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
    // conversion translates it to FEFF (UTF-16 BOM).
    if (string.charCodeAt(0) === 0xFEFF) {
        return string.slice(1);
    }
    return string;
}
