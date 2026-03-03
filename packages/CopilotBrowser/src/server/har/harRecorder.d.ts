/**
 * Copyright (c) Microsoft Corporation.
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
import { Artifact } from '../artifact';
import type { BrowserContext } from '../browserContext';
import type { HarTracerDelegate } from './harTracer';
import type { Page } from '../page';
import type * as channels from '@protocol/channels';
import type * as har from '@trace/har';
export declare class HarRecorder implements HarTracerDelegate {
    private _artifact;
    private _isFlushed;
    private _tracer;
    private _entries;
    private _zipFile;
    private _writtenZipEntries;
    constructor(context: BrowserContext, page: Page | null, options: channels.RecordHarOptions);
    onEntryStarted(entry: har.Entry): void;
    onEntryFinished(entry: har.Entry): void;
    onContentBlob(sha1: string, buffer: Buffer): void;
    flush(): Promise<void>;
    export(): Promise<Artifact>;
}
