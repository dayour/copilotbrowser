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
export declare function writeDockerVersion(dockerImageNameTemplate: string): Promise<void>;
export declare function dockerVersion(dockerImageNameTemplate: string): {
    driverVersion: string;
    dockerImageName: string;
};
export declare function readDockerVersionSync(): null | {
    driverVersion: string;
    dockerImageName: string;
    dockerImageNameTemplate: string;
};
export type DependencyGroup = 'chromium' | 'firefox' | 'webkit' | 'tools';
export declare function installDependenciesWindows(targets: Set<DependencyGroup>, dryRun: boolean): Promise<void>;
export declare function installDependenciesLinux(targets: Set<DependencyGroup>, dryRun: boolean): Promise<void>;
export declare function validateDependenciesWindows(sdkLanguage: string, windowsExeAndDllDirectories: string[]): Promise<void>;
export declare function validateDependenciesLinux(sdkLanguage: string, linuxLddDirectories: string[], dlOpenLibraries: string[]): Promise<void>;
export declare function transformCommandsForRoot(commands: string[]): Promise<{
    command: string;
    args: string[];
    elevatedPermissions: boolean;
}>;
