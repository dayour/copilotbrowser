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
export declare const existsAsync: (path: string) => Promise<boolean>;
export declare function mkdirIfNeeded(filePath: string): Promise<void>;
export declare function removeFolders(dirs: string[]): Promise<(Error | undefined)[]>;
export declare function canAccessFile(file: string): boolean;
export declare function copyFileAndMakeWritable(from: string, to: string): Promise<void>;
export declare function sanitizeForFilePath(s: string): string;
export declare function toPosixPath(aPath: string): string;
type NameValue = {
    name: string;
    value: string;
};
export declare class SerializedFS {
    private _buffers;
    private _error;
    private _operations;
    private _operationsDone;
    constructor();
    mkdir(dir: string): void;
    writeFile(file: string, content: string | Buffer, skipIfExists?: boolean): void;
    appendFile(file: string, text: string, flush?: boolean): void;
    private _flushFile;
    copyFile(from: string, to: string): void;
    syncAndGetError(): Promise<Error>;
    zip(entries: NameValue[], zipFileName: string): void;
    private _appendOperation;
    private _performOperations;
    private _performOperation;
}
export {};
