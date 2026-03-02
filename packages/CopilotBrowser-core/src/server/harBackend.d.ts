/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License");
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
import { ZipFile } from './utils/zipFile';
import type { HeadersArray } from '../utils/isomorphic/types';
import type * as har from '@trace/har';
export declare class HarBackend {
    readonly id: string;
    private _harFile;
    private _zipFile;
    private _baseDir;
    constructor(harFile: har.HARFile, baseDir: string | null, zipFile: ZipFile | null);
    lookup(url: string, method: string, headers: HeadersArray, postData: Buffer | undefined, isNavigationRequest: boolean): Promise<{
        action: 'error' | 'redirect' | 'fulfill' | 'noentry';
        message?: string;
        redirectURL?: string;
        status?: number;
        headers?: HeadersArray;
        body?: Buffer;
    }>;
    private _loadContent;
    private _harFindResponse;
    dispose(): void;
}
