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
import * as childProcess from 'child_process';
export type LaunchProcessOptions = {
    command: string;
    args?: string[];
    env?: NodeJS.ProcessEnv;
    shell?: boolean;
    handleSIGINT?: boolean;
    handleSIGTERM?: boolean;
    handleSIGHUP?: boolean;
    stdio: 'pipe' | 'stdin';
    tempDirectories: string[];
    cwd?: string;
    attemptToGracefullyClose: () => Promise<any>;
    onExit: (exitCode: number | null, signal: string | null) => void;
    log: (message: string) => void;
};
type LaunchResult = {
    launchedProcess: childProcess.ChildProcess;
    gracefullyClose: () => Promise<void>;
    kill: () => Promise<void>;
};
export declare const gracefullyCloseSet: Set<() => Promise<void>>;
export declare function gracefullyCloseAll(): Promise<void>;
export declare function gracefullyProcessExitDoNotHang(code: number, onExit?: () => Promise<void>): void;
export declare function launchProcess(options: LaunchProcessOptions): Promise<LaunchResult>;
export declare function envArrayToObject(env: {
    name: string;
    value: string;
}[]): NodeJS.ProcessEnv;
export {};
