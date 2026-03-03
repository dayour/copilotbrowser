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
exports.ansiRegex = void 0;
exports.escapeWithQuotes = escapeWithQuotes;
exports.escapeTemplateString = escapeTemplateString;
exports.isString = isString;
exports.toTitleCase = toTitleCase;
exports.toSnakeCase = toSnakeCase;
exports.formatObject = formatObject;
exports.formatObjectOrVoid = formatObjectOrVoid;
exports.quoteCSSAttributeValue = quoteCSSAttributeValue;
exports.cacheNormalizedWhitespaces = cacheNormalizedWhitespaces;
exports.normalizeWhiteSpace = normalizeWhiteSpace;
exports.normalizeEscapedRegexQuotes = normalizeEscapedRegexQuotes;
exports.escapeForTextSelector = escapeForTextSelector;
exports.escapeForAttributeSelector = escapeForAttributeSelector;
exports.trimString = trimString;
exports.trimStringWithEllipsis = trimStringWithEllipsis;
exports.escapeRegExp = escapeRegExp;
exports.escapeHTMLAttribute = escapeHTMLAttribute;
exports.escapeHTML = escapeHTML;
exports.longestCommonSubstring = longestCommonSubstring;
exports.parseRegex = parseRegex;
exports.stripAnsiEscapes = stripAnsiEscapes;
// NOTE: this function should not be used to escape any selectors.
function escapeWithQuotes(text, char = '\'') {
    const stringified = JSON.stringify(text);
    const escapedText = stringified.substring(1, stringified.length - 1).replace(/\\"/g, '"');
    if (char === '\'')
        return char + escapedText.replace(/[']/g, '\\\'') + char;
    if (char === '"')
        return char + escapedText.replace(/["]/g, '\\"') + char;
    if (char === '`')
        return char + escapedText.replace(/[`]/g, '\\`') + char;
    throw new Error('Invalid escape char');
}
function escapeTemplateString(text) {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');
}
function isString(obj) {
    return typeof obj === 'string' || obj instanceof String;
}
function toTitleCase(name) {
    return name.charAt(0).toUpperCase() + name.substring(1);
}
function toSnakeCase(name) {
    // E.g. ignoreHTTPSErrors => ignore_https_errors.
    return name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2').toLowerCase();
}
function formatObject(value, indent = '  ', mode = 'multiline') {
    if (typeof value === 'string')
        return escapeWithQuotes(value, '\'');
    if (Array.isArray(value))
        return `[${value.map(o => formatObject(o)).join(', ')}]`;
    if (typeof value === 'object') {
        const keys = Object.keys(value).filter(key => value[key] !== undefined).sort();
        if (!keys.length)
            return '{}';
        const tokens = [];
        for (const key of keys)
            tokens.push(`${key}: ${formatObject(value[key])}`);
        if (mode === 'multiline')
            return `{\n${tokens.join(`,\n${indent}`)}\n}`;
        return `{ ${tokens.join(', ')} }`;
    }
    return String(value);
}
function formatObjectOrVoid(value, indent = '  ') {
    const result = formatObject(value, indent);
    return result === '{}' ? '' : result;
}
function quoteCSSAttributeValue(text) {
    return `"${text.replace(/["\\]/g, char => '\\' + char)}"`;
}
let normalizedWhitespaceCache;
function cacheNormalizedWhitespaces() {
    normalizedWhitespaceCache = new Map();
}
function normalizeWhiteSpace(text) {
    let result = normalizedWhitespaceCache?.get(text);
    if (result === undefined) {
        result = text.replace(/[\u200b\u00ad]/g, '').trim().replace(/\s+/g, ' ');
        normalizedWhitespaceCache?.set(text, result);
    }
    return result;
}
function normalizeEscapedRegexQuotes(source) {
    // This function reverses the effect of escapeRegexForSelector below.
    // Odd number of backslashes followed by the quote -> remove unneeded backslash.
    return source.replace(/(^|[^\\])(\\\\)*\\(['"`])/g, '$1$2$3');
}
function escapeRegexForSelector(re) {
    // Unicode mode does not allow "identity character escapes", so we do not escape and
    // hope that it does not contain quotes and/or >> signs.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Character_escape
    // TODO: rework RE usages in internal selectors away from literal representation to json, e.g. {source,flags}.
    if (re.unicode || re.unicodeSets)
        return String(re);
    // Even number of backslashes followed by the quote -> insert a backslash.
    return String(re).replace(/(^|[^\\])(\\\\)*(["'`])/g, '$1$2\\$3').replace(/>>/g, '\\>\\>');
}
function escapeForTextSelector(text, exact) {
    if (typeof text !== 'string')
        return escapeRegexForSelector(text);
    return `${JSON.stringify(text)}${exact ? 's' : 'i'}`;
}
function escapeForAttributeSelector(value, exact) {
    if (typeof value !== 'string')
        return escapeRegexForSelector(value);
    // TODO: this should actually be
    //   cssEscape(value).replace(/\\ /g, ' ')
    // However, our attribute selectors do not conform to CSS parsing spec,
    // so we escape them differently.
    return `"${value.replace(/\\/g, '\\\\').replace(/["]/g, '\\"')}"${exact ? 's' : 'i'}`;
}
function trimString(input, cap, suffix = '') {
    if (input.length <= cap)
        return input;
    const chars = [...input];
    if (chars.length > cap)
        return chars.slice(0, cap - suffix.length).join('') + suffix;
    return chars.join('');
}
function trimStringWithEllipsis(input, cap) {
    return trimString(input, cap, '\u2026');
}
function escapeRegExp(s) {
    // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
const escaped = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' };
function escapeHTMLAttribute(s) {
    return s.replace(/[&<>"']/ug, char => escaped[char]);
}
function escapeHTML(s) {
    return s.replace(/[&<]/ug, char => escaped[char]);
}
function longestCommonSubstring(s1, s2) {
    const n = s1.length;
    const m = s2.length;
    let maxLen = 0;
    let endingIndex = 0;
    // Initialize a 2D array with zeros
    const dp = Array(n + 1)
        .fill(null)
        .map(() => Array(m + 1).fill(0));
    // Build the dp table
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            if (s1[i - 1] === s2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
                if (dp[i][j] > maxLen) {
                    maxLen = dp[i][j];
                    endingIndex = i;
                }
            }
        }
    }
    // Extract the longest common substring
    return s1.slice(endingIndex - maxLen, endingIndex);
}
function parseRegex(regex) {
    if (regex[0] !== '/')
        throw new Error(`Invalid regex, must start with '/': ${regex}`);
    const lastSlash = regex.lastIndexOf('/');
    if (lastSlash <= 0)
        throw new Error(`Invalid regex, must end with '/' followed by optional flags: ${regex}`);
    const source = regex.slice(1, lastSlash);
    const flags = regex.slice(lastSlash + 1);
    return new RegExp(source, flags);
}
exports.ansiRegex = new RegExp('([\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~])))', 'g');
function stripAnsiEscapes(str) {
    return str.replace(exports.ansiRegex, '');
}
