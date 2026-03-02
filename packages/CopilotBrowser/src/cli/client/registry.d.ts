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
import type { FullConfig } from '../../mcp/browser/config';
export type ClientInfo = {
    version: string;
    workspaceDirHash: string;
    daemonProfilesDir: string;
    workspaceDir: string | undefined;
};
export type SessionConfig = {
    name: string;
    version: string;
    timestamp: number;
    socketPath: string;
    cli: {
        headed?: boolean;
        extension?: boolean;
        browser?: string;
        persistent?: boolean;
        profile?: string;
        config?: string;
    };
    userDataDirPrefix?: string;
    workspaceDir?: string;
    resolvedConfig?: FullConfig;
};
export type SessionEntry = {
    file: string;
    config: SessionConfig;
};
export declare class Registry {
    private _entries;
    private constructor();
    entry(clientInfo: ClientInfo, sessionName: string): SessionEntry | undefined;
    entries(clientInfo: ClientInfo): SessionEntry[];
    entryMap(): Map<string, SessionEntry[]>;
    static loadSessionEntry(file: string): Promise<SessionEntry | undefined>;
    static load(): Promise<Registry>;
}
export declare const baseDaemonDir: string;
export declare function createClientInfo(): ClientInfo;
