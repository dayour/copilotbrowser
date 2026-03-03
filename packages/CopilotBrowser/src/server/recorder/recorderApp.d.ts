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
import { Recorder } from '../recorder';
import { BrowserContext } from '../browserContext';
import type { Language } from '../codegen/types';
import type * as channels from '@protocol/channels';
export type RecorderAppParams = channels.BrowserContextEnableRecorderParams & {
    browserName: string;
    sdkLanguage: Language;
    headed: boolean;
    executablePath?: string;
    channel?: string;
};
export declare class RecorderApp {
    private _recorder;
    private _page;
    readonly wsEndpointForTest: string | undefined;
    private _languageGeneratorOptions;
    private _throttledOutputFile;
    private _actions;
    private _userSources;
    private _recorderSources;
    private _primaryGeneratorId;
    private _selectedGeneratorId;
    private _frontend;
    private constructor();
    private _init;
    private _createDispatcher;
    static show(context: BrowserContext, params: channels.BrowserContextEnableRecorderParams): Promise<void>;
    close(): Promise<void>;
    static showInspectorNoReply(context: BrowserContext): void;
    private static _show;
    private _wireListeners;
    private _onActionAdded;
    private _onSignalAdded;
    private _onUserSourcesChanged;
    private _pushAllSources;
    private _revealSource;
    private _updateActions;
}
export declare class ProgrammaticRecorderApp {
    static run(inspectedContext: BrowserContext, recorder: Recorder, browserName: string, params: channels.BrowserContextEnableRecorderParams): Promise<void>;
}
