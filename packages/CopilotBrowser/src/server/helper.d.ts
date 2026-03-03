/**
 * Copyright 2017 Google Inc. All rights reserved.
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
import type { Progress } from './progress';
import type * as types from './types';
import type { EventEmitter } from 'events';
declare class Helper {
    static completeUserURL(urlString: string): string;
    static enclosingIntRect(rect: types.Rect): types.Rect;
    static enclosingIntSize(size: types.Size): types.Size;
    static getViewportSizeFromWindowFeatures(features: string[]): types.Size | null;
    static waitForEvent(progress: Progress, emitter: EventEmitter, event: string | symbol, predicate?: Function): {
        promise: Promise<any>;
        dispose: () => void;
    };
    static secondsToRoundishMillis(value: number): number;
    static millisToRoundishMillis(value: number): number;
    static debugProtocolLogger(protocolLogger?: types.ProtocolLogger): types.ProtocolLogger;
    static formatBrowserLogs(logs: string[], disconnectReason?: string): string;
}
export declare const helper: typeof Helper;
export {};
