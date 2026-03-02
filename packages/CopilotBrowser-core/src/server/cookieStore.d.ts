/**
 * Copyright (c) Microsoft Corporation.
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
import type * as channels from '@protocol/channels';
export declare class Cookie {
    private _raw;
    constructor(data: channels.NetworkCookie);
    name(): string;
    matches(url: URL): boolean;
    equals(other: Cookie): boolean;
    networkCookie(): channels.NetworkCookie;
    updateExpiresFrom(other: Cookie): void;
    expired(): boolean;
}
export declare class CookieStore {
    private readonly _nameToCookies;
    addCookies(cookies: channels.NetworkCookie[]): void;
    cookies(url: URL): channels.NetworkCookie[];
    allCookies(): channels.NetworkCookie[];
    private _addCookie;
    private _cookiesIterator;
    private static pruneExpired;
}
type RawCookie = {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
};
export declare function parseRawCookie(header: string): RawCookie | null;
export declare function domainMatches(value: string, domain: string): boolean;
export {};
