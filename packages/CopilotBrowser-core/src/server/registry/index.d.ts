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
export { writeDockerVersion } from './dependencies';
export declare const registryDirectory: string;
type BrowsersJSON = {
    comment: string;
    browsers: {
        name: string;
        revision: string;
        browserVersion?: string;
        title?: string;
        installByDefault: boolean;
        revisionOverrides?: {
            [os: string]: string;
        };
    }[];
};
type BrowsersJSONDescriptor = {
    name: string;
    revision: string;
    hasRevisionOverride: boolean;
    browserVersion?: string;
    title?: string;
    installByDefault: boolean;
    dir: string;
};
export type BrowserInfo = {
    browserName: string;
    browserVersion: number;
    browserPath: string;
    referenceDir: string;
};
export type BrowserName = 'chromium' | 'firefox' | 'webkit';
export interface Executable {
    name: string;
    browserName: BrowserName | undefined;
    installType: 'download-by-default' | 'download-on-demand' | 'install-script' | 'none';
    directory: string | undefined;
    downloadURLs?: string[];
    title?: string;
    revision?: string;
    browserVersion?: string;
    executablePathOrDie(sdkLanguage: string): string;
    executablePath(): string | undefined;
    _validateHostRequirements(sdkLanguage: string): Promise<void>;
    wslExecutablePath?: string;
}
export declare class Registry {
    private _executables;
    constructor(browsersJSON: BrowsersJSON);
    private _createChromiumChannel;
    private _createBidiFirefoxChannel;
    executables(): Executable[];
    findExecutable(name: BrowserName): Executable;
    findExecutable(name: string): Executable | undefined;
    defaultExecutables(): Executable[];
    private _dedupe;
    private _validateHostRequirements;
    installDeps(executablesToInstallDeps: Executable[], dryRun: boolean): Promise<void>;
    install(executablesToInstall: Executable[], options?: {
        force?: boolean;
    }): Promise<void>;
    uninstall(all: boolean): Promise<{
        numberOfBrowsersLeft: number;
    }>;
    validateHostRequirementsForExecutablesIfNeeded(executables: Executable[], sdkLanguage: string): Promise<void>;
    private _validateHostRequirementsForExecutableIfNeeded;
    private _downloadURLs;
    private _downloadExecutable;
    calculateDownloadTitle(descriptor: BrowsersJSONDescriptor | Executable): string;
    private _installMSEdgeChannel;
    private _installChromiumChannel;
    listInstalledBrowsers(): Promise<BrowserInfo[]>;
    private _validateInstallationCache;
    private _traverseBrowserInstallations;
    private _deleteStaleBrowsers;
    private _deleteBrokenInstallations;
    private _defaultBrowsersToInstall;
    suggestedBrowsersToInstall(): string;
    isChromiumAlias(name: string): boolean;
    resolveBrowsers(aliases: string[], options: {
        shell?: 'no' | 'only';
    }): Executable[];
}
export declare function browserDirectoryToMarkerFilePath(browserDirectory: string): string;
export declare function buildcopilotbrowserCLICommand(sdkLanguage: string, parameters: string): string;
export declare function installBrowsersForNpmInstall(browsers: string[]): Promise<boolean>;
export declare function findChromiumChannelBestEffort(sdkLanguage: string): string | undefined;
export declare const registry: Registry;
