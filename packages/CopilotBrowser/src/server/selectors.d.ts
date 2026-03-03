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
import type { ParsedSelector } from '../utils/isomorphic/selectorParser';
import type * as channels from '@protocol/channels';
export declare class Selectors {
    private readonly _builtinEngines;
    private readonly _builtinEnginesInMainWorld;
    readonly _engines: Map<string, channels.SelectorEngine>;
    readonly guid: string;
    private _testIdAttributeName;
    constructor(engines: channels.SelectorEngine[], testIdAttributeName: string | undefined);
    register(engine: channels.SelectorEngine): void;
    testIdAttributeName(): string;
    setTestIdAttributeName(testIdAttributeName: string): void;
    parseSelector(selector: string | ParsedSelector, strict: boolean): {
        parsed: ParsedSelector;
        world: "main" | "utility";
        strict: boolean;
    };
}
