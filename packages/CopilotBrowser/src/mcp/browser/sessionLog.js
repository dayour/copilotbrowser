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
exports.SessionLog = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const response_1 = require("./response");
class SessionLog {
    _folder;
    _file;
    _sessionFileQueue = Promise.resolve();
    constructor(sessionFolder) {
        this._folder = sessionFolder;
        this._file = path_1.default.join(this._folder, 'session.md');
    }
    static async create(config, clientInfo) {
        const sessionFolder = await (0, config_1.outputFile)(config, clientInfo, `session-${Date.now()}`, { origin: 'code' });
        await fs_1.default.promises.mkdir(sessionFolder, { recursive: true });
        // eslint-disable-next-line no-console
        console.error(`Session: ${sessionFolder}`);
        return new SessionLog(sessionFolder);
    }
    logResponse(toolName, toolArgs, responseObject) {
        const parsed = (0, response_1.parseResponse)(responseObject);
        if (parsed)
            delete parsed.text;
        const lines = [''];
        lines.push(`### Tool call: ${toolName}`, `- Args`, '```json', JSON.stringify(toolArgs, null, 2), '```');
        if (parsed) {
            lines.push(`- Result`);
            lines.push('```json');
            lines.push(JSON.stringify(parsed, null, 2));
            lines.push('```');
        }
        lines.push('');
        this._sessionFileQueue = this._sessionFileQueue.then(() => fs_1.default.promises.appendFile(this._file, lines.join('\n')));
    }
}
exports.SessionLog = SessionLog;
