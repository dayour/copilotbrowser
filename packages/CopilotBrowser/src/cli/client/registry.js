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
exports.baseDaemonDir = exports.Registry = void 0;
exports.createClientInfo = createClientInfo;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
class Registry {
    _entries;
    constructor(entries) {
        this._entries = entries;
    }
    entry(clientInfo, sessionName) {
        const key = clientInfo.workspaceDir || clientInfo.workspaceDirHash;
        const entries = this._entries.get(key) || [];
        return entries.find(entry => entry.config.name === sessionName);
    }
    entries(clientInfo) {
        const key = clientInfo.workspaceDir || clientInfo.workspaceDirHash;
        return this._entries.get(key) || [];
    }
    entryMap() {
        return this._entries;
    }
    static async loadSessionEntry(file) {
        try {
            const data = await fs_1.default.promises.readFile(file, 'utf-8');
            const config = JSON.parse(data);
            // Sessions from 0.1.0 support.
            if (!config.name)
                config.name = path_1.default.basename(file, '.session');
            if (!config.timestamp)
                config.timestamp = 0;
            return { file, config };
        }
        catch {
            return undefined;
        }
    }
    static async load() {
        const sessions = new Map();
        const hashDirs = await fs_1.default.promises.readdir(exports.baseDaemonDir).catch(() => []);
        for (const workspaceDirHash of hashDirs) {
            const hashDir = path_1.default.join(exports.baseDaemonDir, workspaceDirHash);
            const stat = await fs_1.default.promises.stat(hashDir);
            if (!stat.isDirectory())
                continue;
            const files = await fs_1.default.promises.readdir(hashDir).catch(() => []);
            for (const file of files) {
                if (!file.endsWith('.session'))
                    continue;
                const fileName = path_1.default.join(hashDir, file);
                const entry = await Registry.loadSessionEntry(fileName);
                if (!entry)
                    continue;
                const key = entry.config.workspaceDir || workspaceDirHash;
                let list = sessions.get(key);
                if (!list) {
                    list = [];
                    sessions.set(key, list);
                }
                list.push(entry);
            }
        }
        return new Registry(sessions);
    }
}
exports.Registry = Registry;
exports.baseDaemonDir = (() => {
    if (process.env.copilotbrowser_DAEMON_SESSION_DIR)
        return process.env.copilotbrowser_DAEMON_SESSION_DIR;
    let localCacheDir;
    if (process.platform === 'linux')
        localCacheDir = process.env.XDG_CACHE_HOME || path_1.default.join(os_1.default.homedir(), '.cache');
    if (process.platform === 'darwin')
        localCacheDir = path_1.default.join(os_1.default.homedir(), 'Library', 'Caches');
    if (process.platform === 'win32')
        localCacheDir = process.env.LOCALAPPDATA || path_1.default.join(os_1.default.homedir(), 'AppData', 'Local');
    if (!localCacheDir)
        throw new Error('Unsupported platform: ' + process.platform);
    return path_1.default.join(localCacheDir, 'ms-copilotbrowser', 'daemon');
})();
function createClientInfo() {
    const packageLocation = require.resolve('../../../package.json');
    const packageJSON = require(packageLocation);
    const workspaceDir = findWorkspaceDir(process.cwd());
    const version = process.env.copilotbrowser_CLI_VERSION_FOR_TEST || packageJSON.version;
    const hash = crypto_1.default.createHash('sha1');
    hash.update(workspaceDir || packageLocation);
    const workspaceDirHash = hash.digest('hex').substring(0, 16);
    return {
        version,
        workspaceDir,
        workspaceDirHash,
        daemonProfilesDir: daemonProfilesDir(workspaceDirHash),
    };
}
function findWorkspaceDir(startDir) {
    let dir = startDir;
    for (let i = 0; i < 10; i++) {
        if (fs_1.default.existsSync(path_1.default.join(dir, '.copilotbrowser')))
            return dir;
        const parentDir = path_1.default.dirname(dir);
        if (parentDir === dir)
            break;
        dir = parentDir;
    }
    return undefined;
}
const daemonProfilesDir = (workspaceDirHash) => {
    return path_1.default.join(exports.baseDaemonDir, workspaceDirHash);
};
