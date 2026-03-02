/**
 * Copyright 2018 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import type { ConnectionTransport, ProtocolRequest, ProtocolResponse } from './transport';
export declare class PipeTransport implements ConnectionTransport {
    private _pipeRead;
    private _pipeWrite;
    private _pendingBuffers;
    private _waitForNextTask;
    private _closed;
    private _onclose?;
    onmessage?: (message: ProtocolResponse) => void;
    constructor(pipeWrite: NodeJS.WritableStream, pipeRead: NodeJS.ReadableStream);
    get onclose(): undefined | ((reason?: string) => void);
    set onclose(onclose: undefined | ((reason?: string) => void));
    send(message: ProtocolRequest): void;
    close(): void;
    _dispatch(buffer: Buffer): void;
}
