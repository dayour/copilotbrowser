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
import type { TabHeader } from './tab';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { Context, FilenameTemplate } from './context';
export declare const requestDebug: any;
type ResolvedFile = {
    fileName: string;
    relativeName: string;
    printableLink: string;
};
export declare class Response {
    private _results;
    private _errors;
    private _code;
    private _context;
    private _includeSnapshot;
    private _includeSnapshotFileName;
    private _snapshotMaxLength;
    readonly toolName: string;
    readonly toolArgs: Record<string, any>;
    private _clientWorkspace;
    private _imageResults;
    constructor(context: Context, toolName: string, toolArgs: Record<string, any>, relativeTo?: string);
    private _computRelativeTo;
    resolveClientFile(template: FilenameTemplate, title: string): Promise<ResolvedFile>;
    addTextResult(text: string): void;
    addResult(title: string, data: Buffer | string, file: FilenameTemplate): Promise<void>;
    addFileResult(resolvedFile: ResolvedFile, data: Buffer | string | null): Promise<void>;
    addFileLink(title: string, fileName: string): void;
    registerImageResult(data: Buffer, imageType: 'png' | 'jpeg'): Promise<void>;
    addError(error: string): void;
    addCode(code: string): void;
    setIncludeSnapshot(): void;
    setIncludeFullSnapshot(includeSnapshotFileName?: string): void;
    setSnapshotMaxLength(maxLength: number): void;
    serialize(): Promise<CallToolResult>;
    private _build;
}
export declare function renderTabMarkdown(tab: TabHeader): string[];
export declare function renderTabsMarkdown(tabs: TabHeader[]): string[];
export declare function parseResponse(response: CallToolResult): {
    result: string;
    error: string;
    code: string;
    tabs: string;
    page: string;
    snapshot: string;
    events: string;
    modalState: string;
    isError: boolean;
    attachments: ({
        type: "text";
        text: string;
        annotations?: {
            audience?: ("user" | "assistant")[];
            priority?: number;
            lastModified?: string;
        };
        _meta?: {
            [x: string]: unknown;
        };
    } | {
        type: "image";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[];
            priority?: number;
            lastModified?: string;
        };
        _meta?: {
            [x: string]: unknown;
        };
    } | {
        type: "audio";
        data: string;
        mimeType: string;
        annotations?: {
            audience?: ("user" | "assistant")[];
            priority?: number;
            lastModified?: string;
        };
        _meta?: {
            [x: string]: unknown;
        };
    } | {
        uri: string;
        name: string;
        type: "resource_link";
        description?: string;
        mimeType?: string;
        annotations?: {
            audience?: ("user" | "assistant")[];
            priority?: number;
            lastModified?: string;
        };
        _meta?: {
            [x: string]: unknown;
        };
        icons?: {
            src: string;
            mimeType?: string;
            sizes?: string[];
            theme?: "dark" | "light";
        }[];
        title?: string;
    } | {
        type: "resource";
        resource?: {
            uri: string;
            text: string;
            mimeType?: string;
            _meta?: {
                [x: string]: unknown;
            };
        } | {
            uri: string;
            blob: string;
            mimeType?: string;
            _meta?: {
                [x: string]: unknown;
            };
        };
        annotations?: {
            audience?: ("user" | "assistant")[];
            priority?: number;
            lastModified?: string;
        };
        _meta?: {
            [x: string]: unknown;
        };
    })[];
    text: string;
};
export {};
