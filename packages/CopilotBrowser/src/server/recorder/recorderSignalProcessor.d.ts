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
import type { Signal } from '../../../../recorder/src/actions';
import type { Frame } from '../frames';
import type * as actions from '@recorder/actions';
export interface ProcessorDelegate {
    addAction(actionInContext: actions.ActionInContext): void;
    addSignal(signalInContext: actions.SignalInContext): void;
}
export declare class RecorderSignalProcessor {
    private _delegate;
    private _lastAction;
    constructor(actionSink: ProcessorDelegate);
    addAction(actionInContext: actions.ActionInContext): void;
    signal(pageAlias: string, frame: Frame, signal: Signal): void;
}
