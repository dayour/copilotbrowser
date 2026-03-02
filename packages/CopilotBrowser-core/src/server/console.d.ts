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
import type * as js from './javascript';
import type { Page, Worker } from './page';
import type { ConsoleMessageLocation } from './types';
export declare class ConsoleMessage {
    private _type;
    private _text?;
    private _args;
    private _location;
    private _page;
    private _worker;
    private _timestamp;
    constructor(page: Page | null, worker: Worker | null, type: string, text: string | undefined, args: js.JSHandle[], location: ConsoleMessageLocation, timestamp: number);
    page(): Page;
    worker(): Worker;
    type(): string;
    text(): string;
    args(): js.JSHandle[];
    location(): ConsoleMessageLocation;
    timestamp(): number;
}
