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
import { AsyncLocalStorage } from 'async_hooks';
export type ZoneType = 'apiZone' | 'stepZone';
export declare class Zone {
    private readonly _asyncLocalStorage;
    private readonly _data;
    constructor(asyncLocalStorage: AsyncLocalStorage<Zone | undefined>, store: Map<ZoneType, unknown>);
    with(type: ZoneType, data: unknown): Zone;
    without(type?: ZoneType): Zone;
    run<R>(func: () => R): R;
    data<T>(type: ZoneType): T | undefined;
}
export declare const emptyZone: Zone;
export declare function currentZone(): Zone;
