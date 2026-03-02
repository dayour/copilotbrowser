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
exports.LogFile = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const log_1 = require("../log");
class LogFile {
    _startTime;
    _context;
    _filePrefix;
    _title;
    _file;
    _stopped = false;
    _line = 0;
    _entries = 0;
    _lastLine = 0;
    _lastEntries = 0;
    _writeChain = Promise.resolve();
    constructor(context, startTime, filePrefix, title) {
        this._context = context;
        this._startTime = startTime;
        this._filePrefix = filePrefix;
        this._title = title;
    }
    appendLine(wallTime, text) {
        this._writeChain = this._writeChain.then(() => this._write(wallTime, text)).catch(log_1.logUnhandledError);
    }
    stop() {
        this._stopped = true;
    }
    async take(relativeTo) {
        const logChunk = await this._take();
        if (!logChunk)
            return undefined;
        const logFilePath = relativeTo ? path_1.default.relative(relativeTo, logChunk.file) : logChunk.file;
        const lineRange = logChunk.fromLine === logChunk.toLine
            ? `#L${logChunk.fromLine}`
            : `#L${logChunk.fromLine}-L${logChunk.toLine}`;
        return `${logFilePath}${lineRange}`;
    }
    async _take() {
        await this._writeChain;
        if (!this._file || this._entries === this._lastEntries)
            return undefined;
        const chunk = {
            type: this._title.toLowerCase(),
            file: this._file,
            fromLine: this._lastLine + 1,
            toLine: this._line,
            entryCount: this._entries - this._lastEntries,
        };
        this._lastLine = this._line;
        this._lastEntries = this._entries;
        return chunk;
    }
    async _write(wallTime, text) {
        if (this._stopped)
            return;
        this._file ??= await this._context.outputFile({ prefix: this._filePrefix, ext: 'log', date: new Date(this._startTime) }, { origin: 'code' });
        const relativeTime = Math.round(wallTime - this._startTime);
        const renderedText = await text();
        const logLine = `[${String(relativeTime).padStart(8, ' ')}ms] ${renderedText}\n`;
        await fs_1.default.promises.appendFile(this._file, logLine);
        const lineCount = logLine.split('\n').length - 1;
        this._line += lineCount;
        this._entries++;
    }
}
exports.LogFile = LogFile;
