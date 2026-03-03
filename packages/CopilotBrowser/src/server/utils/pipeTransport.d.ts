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
interface WritableStream {
    write(data: Buffer): void;
}
interface ReadableStream {
    on(event: 'data', callback: (b: Buffer) => void): void;
    on(event: 'close', callback: () => void): void;
}
interface ClosableStream {
    close(): void;
}
export declare class PipeTransport {
    private _pipeWrite;
    private _data;
    private _waitForNextTask;
    private _closed;
    private _bytesLeft;
    onmessage?: (message: string) => void;
    onclose?: () => void;
    private _endian;
    private _closeableStream;
    constructor(pipeWrite: WritableStream, pipeRead: ReadableStream, closeable?: ClosableStream, endian?: 'be' | 'le');
    send(message: string): void;
    close(): void;
    _dispatch(buffer: Buffer): void;
}
export {};
