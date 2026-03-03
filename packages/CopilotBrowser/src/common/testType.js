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
exports.rootTestType = exports.TestTypeImpl = void 0;
exports.mergeTests = mergeTests;
const copilotbrowser_core_1 = require("@copilotbrowser/copilotbrowser");
const utils_1 = require("@copilotbrowser/copilotbrowser/lib/utils");
const globals_1 = require("./globals");
const test_1 = require("./test");
const expect_1 = require("../matchers/expect");
const transform_1 = require("../transform/transform");
const validators_1 = require("./validators");
const testTypeSymbol = Symbol('testType');
class TestTypeImpl {
    fixtures;
    test;
    constructor(fixtures) {
        this.fixtures = fixtures;
        const test = (0, transform_1.wrapFunctionWithLocation)(this._createTest.bind(this, 'default'));
        test[testTypeSymbol] = this;
        test.expect = expect_1.expect;
        test.only = (0, transform_1.wrapFunctionWithLocation)(this._createTest.bind(this, 'only'));
        test.describe = (0, transform_1.wrapFunctionWithLocation)(this._describe.bind(this, 'default'));
        test.describe.only = (0, transform_1.wrapFunctionWithLocation)(this._describe.bind(this, 'only'));
        test.describe.configure = (0, transform_1.wrapFunctionWithLocation)(this._configure.bind(this));
        test.describe.fixme = (0, transform_1.wrapFunctionWithLocation)(this._describe.bind(this, 'fixme'));
        test.describe.parallel = (0, transform_1.wrapFunctionWithLocation)(this._describe.bind(this, 'parallel'));
        test.describe.parallel.only = (0, transform_1.wrapFunctionWithLocation)(this._describe.bind(this, 'parallel.only'));
        test.describe.serial = (0, transform_1.wrapFunctionWithLocation)(this._describe.bind(this, 'serial'));
        test.describe.serial.only = (0, transform_1.wrapFunctionWithLocation)(this._describe.bind(this, 'serial.only'));
        test.describe.skip = (0, transform_1.wrapFunctionWithLocation)(this._describe.bind(this, 'skip'));
        test.beforeEach = (0, transform_1.wrapFunctionWithLocation)(this._hook.bind(this, 'beforeEach'));
        test.afterEach = (0, transform_1.wrapFunctionWithLocation)(this._hook.bind(this, 'afterEach'));
        test.beforeAll = (0, transform_1.wrapFunctionWithLocation)(this._hook.bind(this, 'beforeAll'));
        test.afterAll = (0, transform_1.wrapFunctionWithLocation)(this._hook.bind(this, 'afterAll'));
        test.skip = (0, transform_1.wrapFunctionWithLocation)(this._modifier.bind(this, 'skip'));
        test.fixme = (0, transform_1.wrapFunctionWithLocation)(this._modifier.bind(this, 'fixme'));
        test.fail = (0, transform_1.wrapFunctionWithLocation)(this._modifier.bind(this, 'fail'));
        test.fail.only = (0, transform_1.wrapFunctionWithLocation)(this._createTest.bind(this, 'fail.only'));
        test.slow = (0, transform_1.wrapFunctionWithLocation)(this._modifier.bind(this, 'slow'));
        test.setTimeout = (0, transform_1.wrapFunctionWithLocation)(this._setTimeout.bind(this));
        test.step = this._step.bind(this, 'pass');
        test.step.skip = this._step.bind(this, 'skip');
        test.use = (0, transform_1.wrapFunctionWithLocation)(this._use.bind(this));
        test.extend = (0, transform_1.wrapFunctionWithLocation)(this._extend.bind(this));
        test.info = () => {
            const result = (0, globals_1.currentTestInfo)();
            if (!result)
                throw new Error('test.info() can only be called while test is running');
            return result;
        };
        this.test = test;
    }
    _currentSuite(location, title) {
        const suite = (0, globals_1.currentlyLoadingFileSuite)();
        if (!suite) {
            throw new Error([
                `copilotbrowser Test did not expect ${title} to be called here.`,
                `Most common reasons include:`,
                `- You are calling ${title} in a configuration file.`,
                `- You are calling ${title} in a file that is imported by the configuration file.`,
                `- You have two different versions of @copilotbrowser/test. This usually happens`,
                `  when one of the dependencies in your package.json depends on @copilotbrowser/test.`,
            ].join('\n'));
        }
        return suite;
    }
    _createTest(type, location, title, fnOrDetails, fn) {
        throwIfRunningInsideJest();
        const suite = this._currentSuite(location, 'test()');
        if (!suite)
            return;
        let details;
        let body;
        if (typeof fnOrDetails === 'function') {
            body = fnOrDetails;
            details = {};
        }
        else {
            body = fn;
            details = fnOrDetails;
        }
        const validatedDetails = (0, validators_1.validateTestDetails)(details, location);
        const test = new test_1.TestCase(title, body, this, location);
        test._requireFile = suite._requireFile;
        test.annotations.push(...validatedDetails.annotations);
        test._tags.push(...validatedDetails.tags);
        suite._addTest(test);
        if (type === 'only' || type === 'fail.only')
            test._only = true;
        if (type === 'skip' || type === 'fixme' || type === 'fail')
            test.annotations.push({ type, location });
        else if (type === 'fail.only')
            test.annotations.push({ type: 'fail', location });
    }
    _describe(type, location, titleOrFn, fnOrDetails, fn) {
        throwIfRunningInsideJest();
        const suite = this._currentSuite(location, 'test.describe()');
        if (!suite)
            return;
        let title;
        let body;
        let details;
        if (typeof titleOrFn === 'function') {
            title = '';
            details = {};
            body = titleOrFn;
        }
        else if (typeof fnOrDetails === 'function') {
            title = titleOrFn;
            details = {};
            body = fnOrDetails;
        }
        else {
            title = titleOrFn;
            details = fnOrDetails;
            body = fn;
        }
        const validatedDetails = (0, validators_1.validateTestDetails)(details, location);
        const child = new test_1.Suite(title, 'describe');
        child._requireFile = suite._requireFile;
        child.location = location;
        child._staticAnnotations.push(...validatedDetails.annotations);
        child._tags.push(...validatedDetails.tags);
        suite._addSuite(child);
        if (type === 'only' || type === 'serial.only' || type === 'parallel.only')
            child._only = true;
        if (type === 'serial' || type === 'serial.only')
            child._parallelMode = 'serial';
        if (type === 'parallel' || type === 'parallel.only')
            child._parallelMode = 'parallel';
        if (type === 'skip' || type === 'fixme')
            child._staticAnnotations.push({ type, location });
        for (let parent = suite; parent; parent = parent.parent) {
            if (parent._parallelMode === 'serial' && child._parallelMode === 'parallel')
                throw new Error('describe.parallel cannot be nested inside describe.serial');
            if (parent._parallelMode === 'default' && child._parallelMode === 'parallel')
                throw new Error('describe.parallel cannot be nested inside describe with default mode');
        }
        (0, globals_1.setCurrentlyLoadingFileSuite)(child);
        body();
        (0, globals_1.setCurrentlyLoadingFileSuite)(suite);
    }
    _hook(name, location, title, fn) {
        const suite = this._currentSuite(location, `test.${name}()`);
        if (!suite)
            return;
        if (typeof title === 'function') {
            fn = title;
            title = `${name} hook`;
        }
        suite._hooks.push({ type: name, fn: fn, title, location });
    }
    _configure(location, options) {
        throwIfRunningInsideJest();
        const suite = this._currentSuite(location, `test.describe.configure()`);
        if (!suite)
            return;
        if (options.timeout !== undefined)
            suite._timeout = options.timeout;
        if (options.retries !== undefined)
            suite._retries = options.retries;
        if (options.mode !== undefined) {
            if (suite._parallelMode !== 'none')
                throw new Error(`"${suite._parallelMode}" mode is already assigned for the enclosing scope.`);
            suite._parallelMode = options.mode;
            for (let parent = suite.parent; parent; parent = parent.parent) {
                if (parent._parallelMode === 'serial' && suite._parallelMode === 'parallel')
                    throw new Error('describe with parallel mode cannot be nested inside describe with serial mode');
                if (parent._parallelMode === 'default' && suite._parallelMode === 'parallel')
                    throw new Error('describe with parallel mode cannot be nested inside describe with default mode');
            }
        }
    }
    _modifier(type, location, ...modifierArgs) {
        const suite = (0, globals_1.currentlyLoadingFileSuite)();
        if (suite) {
            if (typeof modifierArgs[0] === 'string' && typeof modifierArgs[1] === 'function' && (type === 'skip' || type === 'fixme' || type === 'fail')) {
                // Support for test.{skip,fixme,fail}(title, body)
                this._createTest(type, location, modifierArgs[0], modifierArgs[1]);
                return;
            }
            if (typeof modifierArgs[0] === 'string' && typeof modifierArgs[1] === 'object' && typeof modifierArgs[2] === 'function' && (type === 'skip' || type === 'fixme' || type === 'fail')) {
                // Support for test.{skip,fixme,fail}(title, details, body)
                this._createTest(type, location, modifierArgs[0], modifierArgs[1], modifierArgs[2]);
                return;
            }
            if (typeof modifierArgs[0] === 'function') {
                suite._modifiers.push({ type, fn: modifierArgs[0], location, description: modifierArgs[1] });
            }
            else {
                if (modifierArgs.length >= 1 && !modifierArgs[0])
                    return;
                const description = modifierArgs[1];
                suite._staticAnnotations.push({ type, description, location });
            }
            return;
        }
        const testInfo = (0, globals_1.currentTestInfo)();
        if (!testInfo)
            throw new Error(`test.${type}() can only be called inside test, describe block or fixture`);
        if (typeof modifierArgs[0] === 'function')
            throw new Error(`test.${type}() with a function can only be called inside describe block`);
        testInfo._modifier(type, location, modifierArgs);
    }
    _setTimeout(location, timeout) {
        const suite = (0, globals_1.currentlyLoadingFileSuite)();
        if (suite) {
            suite._timeout = timeout;
            return;
        }
        const testInfo = (0, globals_1.currentTestInfo)();
        if (!testInfo)
            throw new Error(`test.setTimeout() can only be called from a test`);
        testInfo.setTimeout(timeout);
    }
    _use(location, fixtures) {
        const suite = this._currentSuite(location, `test.use()`);
        if (!suite)
            return;
        suite._use.push({ fixtures, location });
    }
    async _step(expectation, title, body, options = {}) {
        const testInfo = (0, globals_1.currentTestInfo)();
        if (!testInfo)
            throw new Error(`test.step() can only be called from a test`);
        const step = testInfo._addStep({ category: 'test.step', title, location: options.location, box: options.box });
        return await (0, utils_1.currentZone)().with('stepZone', step).run(async () => {
            try {
                let result = undefined;
                result = await (0, utils_1.raceAgainstDeadline)(async () => {
                    try {
                        return await step.info._runStepBody(expectation === 'skip', body, step.location);
                    }
                    catch (e) {
                        // If the step timed out, the test fixtures will tear down, which in turn
                        // will abort unfinished actions in the step body. Record such errors here.
                        if (result?.timedOut)
                            testInfo._failWithError(e);
                        throw e;
                    }
                }, options.timeout ? (0, utils_1.monotonicTime)() + options.timeout : 0);
                if (result.timedOut)
                    throw new copilotbrowser_core_1.errors.TimeoutError(`Step timeout of ${options.timeout}ms exceeded.`);
                step.complete({});
                return result.result;
            }
            catch (error) {
                step.complete({ error });
                throw error;
            }
        });
    }
    _extend(location, fixtures) {
        if (fixtures[testTypeSymbol])
            throw new Error(`test.extend() accepts fixtures object, not a test object.\nDid you mean to call mergeTests()?`);
        const fixturesWithLocation = { fixtures, location };
        return new TestTypeImpl([...this.fixtures, fixturesWithLocation]).test;
    }
}
exports.TestTypeImpl = TestTypeImpl;
function throwIfRunningInsideJest() {
    if (process.env.JEST_WORKER_ID) {
        const packageManagerCommand = (0, utils_1.getPackageManagerExecCommand)();
        throw new Error(`copilotbrowser Test needs to be invoked via '${packageManagerCommand} copilotbrowser test' and excluded from Jest test runs.\n` +
            `Creating one directory for copilotbrowser tests and one for Jest is the recommended way of doing it.\n` +
            `See https://dayour.github.io/copilotbrowser/docs/intro for more information about copilotbrowser Test.`);
    }
}
exports.rootTestType = new TestTypeImpl([]);
function mergeTests(...tests) {
    let result = exports.rootTestType;
    for (const t of tests) {
        const testTypeImpl = t[testTypeSymbol];
        if (!testTypeImpl)
            throw new Error(`mergeTests() accepts "test" functions as parameters.\nDid you mean to call test.extend() with fixtures instead?`);
        // Filter out common ancestor fixtures.
        const newFixtures = testTypeImpl.fixtures.filter(theirs => !result.fixtures.find(ours => ours.fixtures === theirs.fixtures));
        result = new TestTypeImpl([...result.fixtures, ...newFixtures]);
    }
    return result.test;
}
