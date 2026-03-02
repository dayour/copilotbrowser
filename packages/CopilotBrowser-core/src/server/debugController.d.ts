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
import { SdkObject } from './instrumentation';
import type { Language } from '../utils';
import type { copilotbrowser } from './copilotbrowser';
import type { Mode } from '@recorder/recorderTypes';
import type { Progress } from '@protocol/progress';
export declare class DebugController extends SdkObject {
    static Events: {
        StateChanged: string;
        InspectRequested: string;
        SourceChanged: string;
        Paused: string;
        SetModeRequested: string;
    };
    private _trackHierarchyListener;
    private _copilotbrowser;
    _sdkLanguage: Language;
    _generateAutoExpect: boolean;
    constructor(copilotbrowser: copilotbrowser);
    initialize(codegenId: string, sdkLanguage: Language): void;
    dispose(): void;
    setReportStateChanged(enabled: boolean): void;
    setRecorderMode(progress: Progress, params: {
        mode: Mode;
        testIdAttributeName?: string;
        generateAutoExpect?: boolean;
    }): Promise<void>;
    highlight(progress: Progress, params: {
        selector?: string;
        ariaTemplate?: string;
    }): Promise<void>;
    hideHighlight(progress: Progress): Promise<void>;
    resume(progress: Progress): Promise<void>;
    kill(): void;
    private _emitSnapshot;
    private _allRecorders;
    private _closeBrowsersWithoutPages;
}
