"use strict";
/**
 * Copyright Microsoft Corporation. All rights reserved.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.expect = void 0;
exports.mergeExpects = mergeExpects;
const utils_1 = require("copilotbrowser-core/lib/utils");
const matcherHint_1 = require("./matcherHint");
const matchers_1 = require("./matchers");
const toMatchAriaSnapshot_1 = require("./toMatchAriaSnapshot");
const toMatchSnapshot_1 = require("./toMatchSnapshot");
const expectBundle_1 = require("../common/expectBundle");
const globals_1 = require("../common/globals");
const util_1 = require("../util");
const testInfo_1 = require("../worker/testInfo");
function createMatchers(actual, info, prefix) {
    return new Proxy((0, expectBundle_1.expect)(actual), new ExpectMetaInfoProxyHandler(actual, info, prefix));
}
const userMatchersSymbol = Symbol('userMatchers');
function qualifiedMatcherName(qualifier, matcherName) {
    return qualifier.join(':') + '$' + matcherName;
}
function createExpect(info, prefix, userMatchers) {
    const expectInstance = new Proxy(expectBundle_1.expect, {
        apply: function (target, thisArg, argumentsList) {
            const [actual, messageOrOptions] = argumentsList;
            const message = (0, utils_1.isString)(messageOrOptions) ? messageOrOptions : messageOrOptions?.message || info.message;
            const newInfo = { ...info, message };
            if (newInfo.poll) {
                if (typeof actual !== 'function')
                    throw new Error('`expect.poll()` accepts only function as a first argument');
                newInfo.poll.generator = actual;
            }
            return createMatchers(actual, newInfo, prefix);
        },
        get: function (target, property) {
            if (property === 'configure')
                return configure;
            if (property === 'extend') {
                return (matchers) => {
                    const qualifier = [...prefix, (0, utils_1.createGuid)()];
                    const wrappedMatchers = {};
                    for (const [name, matcher] of Object.entries(matchers)) {
                        wrappedMatchers[name] = wrapcopilotbrowserMatcherToPassNiceThis(matcher);
                        const key = qualifiedMatcherName(qualifier, name);
                        wrappedMatchers[key] = wrappedMatchers[name];
                        Object.defineProperty(wrappedMatchers[key], 'name', { value: name });
                    }
                    expectBundle_1.expect.extend(wrappedMatchers);
                    return createExpect(info, qualifier, { ...userMatchers, ...matchers });
                };
            }
            if (property === 'soft') {
                return (actual, messageOrOptions) => {
                    return configure({ soft: true })(actual, messageOrOptions);
                };
            }
            if (property === userMatchersSymbol)
                return userMatchers;
            if (property === 'poll') {
                return (actual, messageOrOptions) => {
                    const poll = (0, utils_1.isString)(messageOrOptions) ? {} : messageOrOptions || {};
                    return configure({ _poll: poll })(actual, messageOrOptions);
                };
            }
            return expectBundle_1.expect[property];
        },
    });
    const configure = (configuration) => {
        const newInfo = { ...info };
        if ('message' in configuration)
            newInfo.message = configuration.message;
        if ('timeout' in configuration)
            newInfo.timeout = configuration.timeout;
        if ('soft' in configuration)
            newInfo.isSoft = configuration.soft;
        if ('_poll' in configuration) {
            newInfo.poll = configuration._poll ? { ...info.poll, generator: () => { } } : undefined;
            if (typeof configuration._poll === 'object') {
                newInfo.poll.timeout = configuration._poll.timeout ?? newInfo.poll.timeout;
                newInfo.poll.intervals = configuration._poll.intervals ?? newInfo.poll.intervals;
            }
        }
        return createExpect(newInfo, prefix, userMatchers);
    };
    return expectInstance;
}
let matcherCallContext;
function setMatcherCallContext(context) {
    matcherCallContext = context;
}
function takeMatcherCallContext() {
    try {
        return matcherCallContext;
    }
    finally {
        // Any subsequent matcher following the first is assumed to be an unsupported legacy asymmetric matcher.
        // Lacking call context in these scenarios is not particularly important.
        matcherCallContext = undefined;
    }
}
const defaultExpectTimeout = 5000;
function wrapcopilotbrowserMatcherToPassNiceThis(matcher) {
    return function (...args) {
        const { isNot, promise, utils } = this;
        const context = takeMatcherCallContext();
        const timeout = context?.expectInfo.timeout ?? context?.testInfo?._projectInternal?.expect?.timeout ?? defaultExpectTimeout;
        const newThis = {
            isNot,
            promise,
            utils,
            timeout,
            _stepInfo: context?.step,
        };
        newThis.equals = throwUnsupportedExpectMatcherError;
        return matcher.call(newThis, ...args);
    };
}
function throwUnsupportedExpectMatcherError() {
    throw new Error('It looks like you are using custom expect matchers that are not compatible with copilotbrowser. See https://aka.ms/copilotbrowser/expect-compatibility');
}
expectBundle_1.expect.setState({ expand: false });
const customAsyncMatchers = {
    toBeAttached: matchers_1.toBeAttached,
    toBeChecked: matchers_1.toBeChecked,
    toBeDisabled: matchers_1.toBeDisabled,
    toBeEditable: matchers_1.toBeEditable,
    toBeEmpty: matchers_1.toBeEmpty,
    toBeEnabled: matchers_1.toBeEnabled,
    toBeFocused: matchers_1.toBeFocused,
    toBeHidden: matchers_1.toBeHidden,
    toBeInViewport: matchers_1.toBeInViewport,
    toBeOK: matchers_1.toBeOK,
    toBeVisible: matchers_1.toBeVisible,
    toContainText: matchers_1.toContainText,
    toContainClass: matchers_1.toContainClass,
    toHaveAccessibleDescription: matchers_1.toHaveAccessibleDescription,
    toHaveAccessibleName: matchers_1.toHaveAccessibleName,
    toHaveAccessibleErrorMessage: matchers_1.toHaveAccessibleErrorMessage,
    toHaveAttribute: matchers_1.toHaveAttribute,
    toHaveClass: matchers_1.toHaveClass,
    toHaveCount: matchers_1.toHaveCount,
    toHaveCSS: matchers_1.toHaveCSS,
    toHaveId: matchers_1.toHaveId,
    toHaveJSProperty: matchers_1.toHaveJSProperty,
    toHaveRole: matchers_1.toHaveRole,
    toHaveText: matchers_1.toHaveText,
    toHaveTitle: matchers_1.toHaveTitle,
    toHaveURL: matchers_1.toHaveURL,
    toHaveValue: matchers_1.toHaveValue,
    toHaveValues: matchers_1.toHaveValues,
    toHaveScreenshot: toMatchSnapshot_1.toHaveScreenshot,
    toMatchAriaSnapshot: toMatchAriaSnapshot_1.toMatchAriaSnapshot,
    toPass: matchers_1.toPass,
};
const customMatchers = {
    ...customAsyncMatchers,
    toMatchSnapshot: toMatchSnapshot_1.toMatchSnapshot,
};
class ExpectMetaInfoProxyHandler {
    _actual;
    _info;
    _prefix;
    constructor(actual, info, prefix) {
        this._actual = actual;
        this._info = { ...info };
        this._prefix = prefix;
    }
    get(target, matcherName, receiver) {
        if (matcherName === 'toThrowError')
            matcherName = 'toThrow';
        let matcher = Reflect.get(target, matcherName, receiver);
        if (typeof matcherName !== 'string')
            return matcher;
        let resolvedMatcherName = matcherName;
        for (let i = this._prefix.length; i > 0; i--) {
            const qualifiedName = qualifiedMatcherName(this._prefix.slice(0, i), matcherName);
            if (Reflect.has(target, qualifiedName)) {
                matcher = Reflect.get(target, qualifiedName, receiver);
                resolvedMatcherName = qualifiedName;
                break;
            }
        }
        if (matcher === undefined)
            throw new Error(`expect: Property '${matcherName}' not found.`);
        if (typeof matcher !== 'function') {
            if (matcherName === 'not')
                this._info.isNot = !this._info.isNot;
            return new Proxy(matcher, this);
        }
        if (this._info.poll) {
            if (customAsyncMatchers[matcherName] || matcherName === 'resolves' || matcherName === 'rejects')
                throw new Error(`\`expect.poll()\` does not support "${matcherName}" matcher.`);
            matcher = (...args) => pollMatcher(resolvedMatcherName, this._info, this._prefix, ...args);
        }
        return (...args) => {
            const testInfo = (0, globals_1.currentTestInfo)();
            setMatcherCallContext({ expectInfo: this._info, testInfo });
            if (!testInfo)
                return matcher.call(target, ...args);
            const customMessage = this._info.message || '';
            const suffixes = (0, matchers_1.computeMatcherTitleSuffix)(matcherName, this._actual, args);
            const defaultTitle = `${this._info.poll ? 'poll ' : ''}${this._info.isSoft ? 'soft ' : ''}${this._info.isNot ? 'not ' : ''}${matcherName}${suffixes.short || ''}`;
            const shortTitle = customMessage || `Expect ${(0, utils_1.escapeWithQuotes)(defaultTitle, '"')}`;
            const longTitle = shortTitle + (suffixes.long || '');
            const apiName = `expect${this._info.poll ? '.poll ' : ''}${this._info.isSoft ? '.soft ' : ''}${this._info.isNot ? '.not' : ''}.${matcherName}${suffixes.short || ''}`;
            // This looks like it is unnecessary, but it isn't - we need to filter
            // out all the frames that belong to the test runner from caught runtime errors.
            const stackFrames = (0, util_1.filteredStackTrace)((0, utils_1.captureRawStack)());
            // toPass and poll matchers can contain other steps, expects and API calls,
            // so they behave like a retriable step.
            const stepInfo = {
                category: 'expect',
                apiName,
                title: longTitle,
                shortTitle,
                params: args[0] ? { expected: args[0] } : undefined,
                infectParentStepsWithError: this._info.isSoft,
            };
            const step = testInfo._addStep(stepInfo);
            const reportStepError = (e) => {
                const jestError = (0, matcherHint_1.isJestError)(e) ? e : null;
                const expectError = jestError ? new matcherHint_1.ExpectError(jestError, customMessage, stackFrames) : undefined;
                if (jestError?.matcherResult.suggestedRebaseline) {
                    // NOTE: this is a workaround for the fact that we can't pass the suggested rebaseline
                    // for passing matchers. See toMatchAriaSnapshot for a counterpart.
                    step.complete({ suggestedRebaseline: jestError?.matcherResult.suggestedRebaseline });
                    return;
                }
                const error = expectError ?? e;
                step.complete({ error });
                if (this._info.isSoft)
                    testInfo._failWithError(error);
                else
                    throw error;
            };
            const finalizer = () => {
                step.complete({});
            };
            try {
                setMatcherCallContext({ expectInfo: this._info, testInfo, step: step.info });
                const callback = () => matcher.call(target, ...args);
                const result = (0, utils_1.currentZone)().with('stepZone', step).run(callback);
                if (result instanceof Promise)
                    return result.then(finalizer).catch(reportStepError);
                finalizer();
                return result;
            }
            catch (e) {
                void reportStepError(e);
            }
        };
    }
}
async function pollMatcher(qualifiedMatcherName, info, prefix, ...args) {
    const testInfo = (0, globals_1.currentTestInfo)();
    const poll = info.poll;
    const timeout = poll.timeout ?? info.timeout ?? testInfo?._projectInternal?.expect?.timeout ?? defaultExpectTimeout;
    const { deadline, timeoutMessage } = testInfo ? testInfo._deadlineForMatcher(timeout) : testInfo_1.TestInfoImpl._defaultDeadlineForMatcher(timeout);
    const result = await (0, utils_1.pollAgainstDeadline)(async () => {
        if (testInfo && (0, globals_1.currentTestInfo)() !== testInfo)
            return { continuePolling: false, result: undefined };
        const innerInfo = {
            ...info,
            isSoft: false, // soft is outside of poll, not inside
            poll: undefined,
        };
        const value = await poll.generator();
        try {
            let matchers = createMatchers(value, innerInfo, prefix);
            if (info.isNot)
                matchers = matchers.not;
            matchers[qualifiedMatcherName](...args);
            return { continuePolling: false, result: undefined };
        }
        catch (error) {
            return { continuePolling: true, result: error };
        }
    }, deadline, poll.intervals ?? [100, 250, 500, 1000]);
    if (result.timedOut) {
        const message = result.result ? [
            result.result.message,
            '',
            `Call Log:`,
            `- ${timeoutMessage}`,
        ].join('\n') : timeoutMessage;
        throw new Error(message);
    }
}
exports.expect = createExpect({}, [], {}).extend(customMatchers);
function mergeExpects(...expects) {
    let merged = exports.expect;
    for (const e of expects) {
        const internals = e[userMatchersSymbol];
        if (!internals) // non-copilotbrowser expects mutate the global expect, so we don't need to do anything special
            continue;
        merged = merged.extend(internals);
    }
    return merged;
}
