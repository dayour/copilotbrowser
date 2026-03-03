"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isURLPattern = void 0;
exports.globToRegexPattern = globToRegexPattern;
exports.serializeURLPattern = serializeURLPattern;
exports.serializeURLMatch = serializeURLMatch;
exports.deserializeURLMatch = deserializeURLMatch;
exports.urlMatchesEqual = urlMatchesEqual;
exports.urlMatches = urlMatches;
exports.resolveGlobToRegexPattern = resolveGlobToRegexPattern;
exports.constructURLBasedOnBaseURL = constructURLBasedOnBaseURL;
const stringUtils_1 = require("./stringUtils");
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#escaping
const escapedChars = new Set(['$', '^', '+', '.', '*', '(', ')', '|', '\\', '?', '{', '}', '[', ']']);
function globToRegexPattern(glob) {
    const tokens = ['^'];
    let inGroup = false;
    for (let i = 0; i < glob.length; ++i) {
        const c = glob[i];
        if (c === '\\' && i + 1 < glob.length) {
            const char = glob[++i];
            tokens.push(escapedChars.has(char) ? '\\' + char : char);
            continue;
        }
        if (c === '*') {
            const charBefore = glob[i - 1];
            let starCount = 1;
            while (glob[i + 1] === '*') {
                starCount++;
                i++;
            }
            if (starCount > 1) {
                const charAfter = glob[i + 1];
                // Match either /..something../ or /.
                if (charAfter === '/') {
                    if (charBefore === '/')
                        tokens.push('((.+/)|)');
                    else
                        tokens.push('(.*/)');
                    ++i;
                }
                else {
                    tokens.push('(.*)');
                }
            }
            else {
                tokens.push('([^/]*)');
            }
            continue;
        }
        switch (c) {
            case '{':
                inGroup = true;
                tokens.push('(');
                break;
            case '}':
                inGroup = false;
                tokens.push(')');
                break;
            case ',':
                if (inGroup) {
                    tokens.push('|');
                    break;
                }
                tokens.push('\\' + c);
                break;
            default:
                tokens.push(escapedChars.has(c) ? '\\' + c : c);
        }
    }
    tokens.push('$');
    return tokens.join('');
}
function isRegExp(obj) {
    return obj instanceof RegExp || Object.prototype.toString.call(obj) === '[object RegExp]';
}
// eslint-disable-next-line no-restricted-globals
const isURLPattern = (v) => typeof globalThis.URLPattern === 'function' && v instanceof globalThis.URLPattern;
exports.isURLPattern = isURLPattern;
function serializeURLPattern(v) {
    return {
        hash: v.hash,
        hostname: v.hostname,
        password: v.password,
        pathname: v.pathname,
        port: v.port,
        protocol: v.protocol,
        search: v.search,
        username: v.username,
    };
}
function serializeURLMatch(match) {
    if ((0, stringUtils_1.isString)(match))
        return { glob: match };
    if (isRegExp(match))
        return { regexSource: match.source, regexFlags: match.flags };
    if ((0, exports.isURLPattern)(match))
        return { urlPattern: serializeURLPattern(match) };
    // Functions cannot be serialized
    return undefined;
}
function deserializeURLPattern(v) {
    // Client is on Node 24+ and can use URLPattern, Server is not. Let's match all URLs on the server, they'll be filtered again on the client.
    // eslint-disable-next-line no-restricted-globals
    if (typeof globalThis.URLPattern !== 'function')
        return () => true;
    // eslint-disable-next-line no-restricted-globals
    return new globalThis.URLPattern({
        hash: v.hash,
        hostname: v.hostname,
        password: v.password,
        pathname: v.pathname,
        port: v.port,
        protocol: v.protocol,
        search: v.search,
        username: v.username,
    });
}
function deserializeURLMatch(match) {
    if (match.regexSource)
        return new RegExp(match.regexSource, match.regexFlags);
    if (match.urlPattern)
        return deserializeURLPattern(match.urlPattern);
    return match.glob;
}
function urlMatchesEqual(match1, match2) {
    if (isRegExp(match1) && isRegExp(match2))
        return match1.source === match2.source && match1.flags === match2.flags;
    return match1 === match2;
}
function urlMatches(baseURL, urlString, match, webSocketUrl) {
    if (match === undefined || match === '')
        return true;
    if ((0, stringUtils_1.isString)(match))
        match = new RegExp(resolveGlobToRegexPattern(baseURL, match, webSocketUrl));
    if (isRegExp(match)) {
        // Normalize the URL hostname to lowercase (hostnames are case-insensitive) before matching.
        // Only normalize URLs with a real origin (http/https/etc.); skip opaque origins (about:, data:, file:).
        const url = parseURL(urlString);
        const normalizedUrl = (url && url.origin !== 'null') ? url.href : urlString;
        return match.test(normalizedUrl);
    }
    const url = parseURL(urlString);
    if (!url)
        return false;
    if ((0, exports.isURLPattern)(match))
        return match.test(url.href);
    if (typeof match !== 'function')
        throw new Error('url parameter should be string, RegExp, URLPattern or function');
    return match(url);
}
function resolveGlobToRegexPattern(baseURL, glob, webSocketUrl) {
    if (webSocketUrl)
        baseURL = toWebSocketBaseUrl(baseURL);
    glob = resolveGlobBase(baseURL, glob);
    return globToRegexPattern(glob);
}
function toWebSocketBaseUrl(baseURL) {
    // Allow http(s) baseURL to match ws(s) urls.
    if (baseURL && /^https?:\/\//.test(baseURL))
        baseURL = baseURL.replace(/^http/, 'ws');
    return baseURL;
}
function resolveGlobBase(baseURL, match) {
    if (!match.startsWith('*')) {
        const tokenMap = new Map();
        function mapToken(original, replacement) {
            if (original.length === 0)
                return '';
            tokenMap.set(replacement, original);
            return replacement;
        }
        // Escaped `\\?` behaves the same as `?` in our glob patterns.
        match = match.replaceAll(/\\\\\?/g, '?');
        // Special case about: URLs as they are not relative to baseURL
        if (match.startsWith('about:') || match.startsWith('data:')
            || match.startsWith('chrome:') || match.startsWith('edge:')
            || match.startsWith('file:'))
            return match;
        // Glob symbols may be escaped in the URL and some of them such as ? affect resolution,
        // so we replace them with safe components first.
        const relativePath = match.split('/').map((token, index) => {
            if (token === '.' || token === '..' || token === '')
                return token;
            // Handle special case of http*://, note that the new schema has to be
            // a web schema so that slashes are properly inserted after domain.
            if (index === 0 && token.endsWith(':')) {
                // Replace any pattern with http:
                if (token.indexOf('*') !== -1 || token.indexOf('{') !== -1)
                    return mapToken(token, 'http:');
                // Preserve explicit schema as is as it may affect trailing slashes after domain.
                return token;
            }
            const questionIndex = token.indexOf('?');
            if (questionIndex === -1)
                return mapToken(token, `$_${index}_$`);
            const newPrefix = mapToken(token.substring(0, questionIndex), `$_${index}_$`);
            const newSuffix = mapToken(token.substring(questionIndex), `?$_${index}_$`);
            return newPrefix + newSuffix;
        }).join('/');
        const result = resolveBaseURL(baseURL, relativePath);
        let resolved = result.resolved;
        for (const [token, original] of tokenMap) {
            const normalize = result.caseInsensitivePart?.includes(token);
            resolved = resolved.replace(token, normalize ? original.toLowerCase() : original);
        }
        match = resolved;
    }
    return match;
}
function parseURL(url) {
    try {
        return new URL(url);
    }
    catch (e) {
        return null;
    }
}
function constructURLBasedOnBaseURL(baseURL, givenURL) {
    try {
        return resolveBaseURL(baseURL, givenURL).resolved;
    }
    catch (e) {
        return givenURL;
    }
}
function resolveBaseURL(baseURL, givenURL) {
    try {
        const url = new URL(givenURL, baseURL);
        const resolved = url.toString();
        // Schema and domain are case-insensitive.
        const caseInsensitivePrefix = url.origin;
        return { resolved, caseInsensitivePart: caseInsensitivePrefix };
    }
    catch (e) {
        return { resolved: givenURL };
    }
}
