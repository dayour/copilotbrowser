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
exports.configFromIniFile = configFromIniFile;
exports.configsFromIniFile = configsFromIniFile;
const fs_1 = __importDefault(require("fs"));
const utilsBundle_1 = require("copilotbrowser-core/lib/utilsBundle");
function configFromIniFile(filePath) {
    const content = fs_1.default.readFileSync(filePath, 'utf8');
    const parsed = utilsBundle_1.ini.parse(content);
    return iniEntriesToConfig(parsed);
}
function configsFromIniFile(filePath) {
    const content = fs_1.default.readFileSync(filePath, 'utf8');
    const parsed = utilsBundle_1.ini.parse(content);
    const result = new Map();
    for (const [sectionName, sectionData] of Object.entries(parsed)) {
        if (typeof sectionData !== 'object' || sectionData === null)
            continue;
        result.set(sectionName, iniEntriesToConfig(sectionData));
    }
    return result;
}
function iniEntriesToConfig(entries) {
    const config = {};
    for (const [targetPath, rawValue] of Object.entries(entries)) {
        const type = longhandTypes[targetPath];
        const value = type ? coerceToType(rawValue, type) : coerceIniValue(rawValue);
        setNestedValue(config, targetPath, value);
    }
    return config;
}
function coerceToType(value, type) {
    switch (type) {
        case 'string':
            return String(value);
        case 'number':
            return Number(value);
        case 'boolean':
            if (typeof value === 'boolean')
                return value;
            return value === 'true' || value === '1';
        case 'string[]':
            if (Array.isArray(value))
                return value.map(String);
            return [String(value)];
        case 'size': {
            if (typeof value === 'string' && value.includes('x')) {
                const [w, h] = value.split('x').map(Number);
                if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0)
                    return { width: w, height: h };
            }
            return undefined;
        }
    }
}
function coerceIniValue(value) {
    if (typeof value !== 'string')
        return value;
    const trimmed = value.trim();
    if (trimmed === '')
        return trimmed;
    const num = Number(trimmed);
    if (!isNaN(num))
        return num;
    return value;
}
function setNestedValue(obj, dotPath, value) {
    const parts = dotPath.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current) || typeof current[part] !== 'object' || current[part] === null)
            current[part] = {};
        current = current[part];
    }
    current[parts[parts.length - 1]] = value;
}
const longhandTypes = {
    // browser direct
    'browser.browserName': 'string',
    'browser.isolated': 'boolean',
    'browser.userDataDir': 'string',
    'browser.cdpEndpoint': 'string',
    'browser.cdpTimeout': 'number',
    'browser.remoteEndpoint': 'string',
    'browser.initPage': 'string[]',
    'browser.initScript': 'string[]',
    // browser.launchOptions
    'browser.launchOptions.channel': 'string',
    'browser.launchOptions.headless': 'boolean',
    'browser.launchOptions.executablePath': 'string',
    'browser.launchOptions.chromiumSandbox': 'boolean',
    'browser.launchOptions.args': 'string[]',
    'browser.launchOptions.downloadsPath': 'string',
    'browser.launchOptions.handleSIGHUP': 'boolean',
    'browser.launchOptions.handleSIGINT': 'boolean',
    'browser.launchOptions.handleSIGTERM': 'boolean',
    'browser.launchOptions.slowMo': 'number',
    'browser.launchOptions.timeout': 'number',
    'browser.launchOptions.tracesDir': 'string',
    'browser.launchOptions.proxy.server': 'string',
    'browser.launchOptions.proxy.bypass': 'string',
    'browser.launchOptions.proxy.username': 'string',
    'browser.launchOptions.proxy.password': 'string',
    // browser.contextOptions
    'browser.contextOptions.acceptDownloads': 'boolean',
    'browser.contextOptions.baseURL': 'string',
    'browser.contextOptions.bypassCSP': 'boolean',
    'browser.contextOptions.colorScheme': 'string',
    'browser.contextOptions.contrast': 'string',
    'browser.contextOptions.deviceScaleFactor': 'number',
    'browser.contextOptions.forcedColors': 'string',
    'browser.contextOptions.hasTouch': 'boolean',
    'browser.contextOptions.ignoreHTTPSErrors': 'boolean',
    'browser.contextOptions.isMobile': 'boolean',
    'browser.contextOptions.javaScriptEnabled': 'boolean',
    'browser.contextOptions.locale': 'string',
    'browser.contextOptions.offline': 'boolean',
    'browser.contextOptions.permissions': 'string[]',
    'browser.contextOptions.reducedMotion': 'string',
    'browser.contextOptions.screen': 'size',
    'browser.contextOptions.serviceWorkers': 'string',
    'browser.contextOptions.storageState': 'string',
    'browser.contextOptions.strictSelectors': 'boolean',
    'browser.contextOptions.timezoneId': 'string',
    'browser.contextOptions.userAgent': 'string',
    'browser.contextOptions.viewport': 'size',
    // top-level
    'extension': 'boolean',
    'capabilities': 'string[]',
    'saveSession': 'boolean',
    'saveTrace': 'boolean',
    'saveVideo': 'size',
    'sharedBrowserContext': 'boolean',
    'outputDir': 'string',
    'outputMode': 'string',
    'imageResponses': 'string',
    'allowUnrestrictedFileAccess': 'boolean',
    'codegen': 'string',
    'testIdAttribute': 'string',
    // server
    'server.port': 'number',
    'server.host': 'string',
    'server.allowedHosts': 'string[]',
    // console
    'console.level': 'string',
    // network
    'network.allowedOrigins': 'string[]',
    'network.blockedOrigins': 'string[]',
    // timeouts
    'timeouts.action': 'number',
    'timeouts.navigation': 'number',
    // snapshot
    'snapshot.mode': 'string',
};
