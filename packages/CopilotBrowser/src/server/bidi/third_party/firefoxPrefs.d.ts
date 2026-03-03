/**
 * @license
 * Copyright 2023 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
interface ProfileOptions {
    preferences: Record<string, unknown>;
    path: string;
}
export declare function createProfile(options: ProfileOptions): Promise<void>;
export {};
