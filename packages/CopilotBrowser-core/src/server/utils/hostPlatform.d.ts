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
export type HostPlatform = 'win64' | 'mac10.13' | 'mac10.14' | 'mac10.15' | 'mac11' | 'mac11-arm64' | 'mac12' | 'mac12-arm64' | 'mac13' | 'mac13-arm64' | 'mac14' | 'mac14-arm64' | 'mac15' | 'mac15-arm64' | 'ubuntu18.04-x64' | 'ubuntu18.04-arm64' | 'ubuntu20.04-x64' | 'ubuntu20.04-arm64' | 'ubuntu22.04-x64' | 'ubuntu22.04-arm64' | 'ubuntu24.04-x64' | 'ubuntu24.04-arm64' | 'debian11-x64' | 'debian11-arm64' | 'debian12-x64' | 'debian12-arm64' | 'debian13-x64' | 'debian13-arm64' | '<unknown>';
export declare const hostPlatform: HostPlatform, isOfficiallySupportedPlatform: boolean;
export type ShortPlatform = 'mac-x64' | 'mac-arm64' | 'linux-x64' | 'linux-arm64' | 'win-x64' | '<unknown>';
export declare const shortPlatform: ShortPlatform;
export declare function hasGpuMac(): boolean;
