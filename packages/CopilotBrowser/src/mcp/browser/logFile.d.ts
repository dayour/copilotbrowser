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
import type { Context } from './context';
export type LogChunk = {
    type: string;
    file: string;
    fromLine: number;
    toLine: number;
    entryCount: number;
};
export declare class LogFile {
    private _startTime;
    private _context;
    private _filePrefix;
    private _title;
    private _file;
    private _stopped;
    private _line;
    private _entries;
    private _lastLine;
    private _lastEntries;
    private _writeChain;
    constructor(context: Context, startTime: number, filePrefix: string, title: string);
    appendLine(wallTime: number, text: () => string | Promise<string>): void;
    stop(): void;
    take(relativeTo?: string): Promise<string | undefined>;
    private _take;
    private _write;
}
