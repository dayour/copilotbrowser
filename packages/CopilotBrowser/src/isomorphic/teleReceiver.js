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
exports.baseFullConfig = exports.TeleTestResult = exports.TeleTestCase = exports.TeleSuite = exports.TeleReporterReceiver = void 0;
exports.serializeRegexPatterns = serializeRegexPatterns;
exports.parseRegexPatterns = parseRegexPatterns;
exports.computeTestCaseOutcome = computeTestCaseOutcome;
exports.asFullResult = asFullResult;
exports.asFullConfig = asFullConfig;
class TeleReporterReceiver {
    isListing = false;
    _rootSuite;
    _options;
    _reporter;
    _tests = new Map();
    _rootDir;
    _config;
    constructor(reporter, options = {}) {
        this._rootSuite = new TeleSuite('', 'root');
        this._options = options;
        this._reporter = reporter;
    }
    reset() {
        this._rootSuite._entries = [];
        this._tests.clear();
    }
    dispatch(message) {
        const { method, params } = message;
        if (method === 'onConfigure') {
            this._onConfigure(params.config);
            return;
        }
        if (method === 'onProject') {
            this._onProject(params.project);
            return;
        }
        if (method === 'onBegin') {
            this._onBegin();
            return;
        }
        if (method === 'onTestBegin') {
            this._onTestBegin(params.testId, params.result);
            return;
        }
        if (method === 'onTestPaused') {
            this._onTestPaused(params.testId, params.resultId, params.errors);
            return;
        }
        if (method === 'onTestEnd') {
            this._onTestEnd(params.test, params.result);
            return;
        }
        if (method === 'onStepBegin') {
            this._onStepBegin(params.testId, params.resultId, params.step);
            return;
        }
        if (method === 'onAttach') {
            this._onAttach(params.testId, params.resultId, params.attachments);
            return;
        }
        if (method === 'onStepEnd') {
            this._onStepEnd(params.testId, params.resultId, params.step);
            return;
        }
        if (method === 'onError') {
            this._onError(params.error);
            return;
        }
        if (method === 'onStdIO') {
            this._onStdIO(params.type, params.testId, params.resultId, params.data, params.isBase64);
            return;
        }
        if (method === 'onEnd')
            return this._onEnd(params.result);
        if (method === 'onExit')
            return this._onExit();
    }
    _onConfigure(config) {
        this._rootDir = config.rootDir;
        this._config = this._parseConfig(config);
        this._reporter.onConfigure?.(this._config);
    }
    _onProject(project) {
        let projectSuite = this._options.mergeProjects ? this._rootSuite.suites.find(suite => suite.project().name === project.name) : undefined;
        if (!projectSuite) {
            projectSuite = new TeleSuite(project.name, 'project');
            this._rootSuite._addSuite(projectSuite);
        }
        const parsed = this._parseProject(project);
        // Always update project in watch mode.
        projectSuite._project = parsed;
        let index = -1;
        if (this._options.mergeProjects)
            index = this._config.projects.findIndex(p => p.name === project.name);
        if (index === -1)
            this._config.projects.push(parsed);
        else
            this._config.projects[index] = parsed;
        for (const suite of project.suites)
            this._mergeSuiteInto(suite, projectSuite);
    }
    _onBegin() {
        this._reporter.onBegin?.(this._rootSuite);
    }
    _onTestBegin(testId, payload) {
        const test = this._tests.get(testId);
        if (this._options.clearPreviousResultsWhenTestBegins)
            test.results = [];
        const testResult = test._createTestResult(payload.id);
        testResult.retry = payload.retry;
        testResult.workerIndex = payload.workerIndex;
        testResult.parallelIndex = payload.parallelIndex;
        testResult.setStartTimeNumber(payload.startTime);
        this._reporter.onTestBegin?.(test, testResult);
    }
    _onTestPaused(testId, resultId, errors) {
        const test = this._tests.get(testId);
        const result = test.results.find(r => r._id === resultId);
        result.errors.push(...errors);
        result.error = result.errors[0];
        void this._reporter.onTestPaused?.(test, result);
    }
    _onTestEnd(testEndPayload, payload) {
        const test = this._tests.get(testEndPayload.testId);
        test.timeout = testEndPayload.timeout;
        test.expectedStatus = testEndPayload.expectedStatus;
        const result = test.results.find(r => r._id === payload.id);
        result.duration = payload.duration;
        result.status = payload.status;
        result.errors.push(...payload.errors ?? []);
        result.error = result.errors[0];
        // Attachments are only present here from legacy blobs. These override all _onAttach events
        if (!!payload.attachments)
            result.attachments = this._parseAttachments(payload.attachments);
        if (payload.annotations) {
            this._absoluteAnnotationLocationsInplace(payload.annotations);
            result.annotations = payload.annotations;
            test.annotations = payload.annotations;
        }
        this._reporter.onTestEnd?.(test, result);
        // Free up the memory as won't see these step ids.
        result._stepMap = new Map();
    }
    _onStepBegin(testId, resultId, payload) {
        const test = this._tests.get(testId);
        const result = test.results.find(r => r._id === resultId);
        const parentStep = payload.parentStepId ? result._stepMap.get(payload.parentStepId) : undefined;
        const location = this._absoluteLocation(payload.location);
        const step = new TeleTestStep(payload, parentStep, location, result);
        if (parentStep)
            parentStep.steps.push(step);
        else
            result.steps.push(step);
        result._stepMap.set(payload.id, step);
        this._reporter.onStepBegin?.(test, result, step);
    }
    _onStepEnd(testId, resultId, payload) {
        const test = this._tests.get(testId);
        const result = test.results.find(r => r._id === resultId);
        const step = result._stepMap.get(payload.id);
        step._endPayload = payload;
        step.duration = payload.duration;
        step.error = payload.error;
        this._reporter.onStepEnd?.(test, result, step);
    }
    _onAttach(testId, resultId, attachments) {
        const test = this._tests.get(testId);
        const result = test.results.find(r => r._id === resultId);
        result.attachments.push(...attachments.map(a => ({
            name: a.name,
            contentType: a.contentType,
            path: a.path,
            body: a.base64 && globalThis.Buffer ? Buffer.from(a.base64, 'base64') : undefined,
        })));
    }
    _onError(error) {
        this._reporter.onError?.(error);
    }
    _onStdIO(type, testId, resultId, data, isBase64) {
        const chunk = isBase64 ? (globalThis.Buffer ? Buffer.from(data, 'base64') : atob(data)) : data;
        const test = testId ? this._tests.get(testId) : undefined;
        const result = test && resultId ? test.results.find(r => r._id === resultId) : undefined;
        if (type === 'stdout') {
            result?.stdout.push(chunk);
            this._reporter.onStdOut?.(chunk, test, result);
        }
        else {
            result?.stderr.push(chunk);
            this._reporter.onStdErr?.(chunk, test, result);
        }
    }
    async _onEnd(result) {
        await this._reporter.onEnd?.(asFullResult(result));
    }
    _onExit() {
        return this._reporter.onExit?.();
    }
    _parseConfig(config) {
        const result = asFullConfig(config);
        if (this._options.configOverrides) {
            result.configFile = this._options.configOverrides.configFile;
            result.reportSlowTests = this._options.configOverrides.reportSlowTests;
            result.quiet = this._options.configOverrides.quiet;
            result.reporter = [...this._options.configOverrides.reporter];
        }
        return result;
    }
    _parseProject(project) {
        return {
            metadata: project.metadata,
            name: project.name,
            outputDir: this._absolutePath(project.outputDir),
            repeatEach: project.repeatEach,
            retries: project.retries,
            testDir: this._absolutePath(project.testDir),
            testIgnore: parseRegexPatterns(project.testIgnore),
            testMatch: parseRegexPatterns(project.testMatch),
            timeout: project.timeout,
            grep: parseRegexPatterns(project.grep),
            grepInvert: parseRegexPatterns(project.grepInvert),
            dependencies: project.dependencies,
            teardown: project.teardown,
            snapshotDir: this._absolutePath(project.snapshotDir),
            ignoreSnapshots: project.ignoreSnapshots ?? false,
            use: project.use,
        };
    }
    _parseAttachments(attachments) {
        return attachments.map(a => {
            return {
                ...a,
                body: a.base64 && globalThis.Buffer ? Buffer.from(a.base64, 'base64') : undefined,
            };
        });
    }
    _mergeSuiteInto(jsonSuite, parent) {
        let targetSuite = parent.suites.find(s => s.title === jsonSuite.title);
        if (!targetSuite) {
            targetSuite = new TeleSuite(jsonSuite.title, parent.type === 'project' ? 'file' : 'describe');
            parent._addSuite(targetSuite);
        }
        targetSuite.location = this._absoluteLocation(jsonSuite.location);
        jsonSuite.entries.forEach(e => {
            if ('testId' in e)
                this._mergeTestInto(e, targetSuite);
            else
                this._mergeSuiteInto(e, targetSuite);
        });
    }
    _mergeTestInto(jsonTest, parent) {
        let targetTest = this._options.mergeTestCases ? parent.tests.find(s => s.title === jsonTest.title && s.repeatEachIndex === jsonTest.repeatEachIndex) : undefined;
        if (!targetTest) {
            targetTest = new TeleTestCase(jsonTest.testId, jsonTest.title, this._absoluteLocation(jsonTest.location), jsonTest.repeatEachIndex);
            parent._addTest(targetTest);
            this._tests.set(targetTest.id, targetTest);
        }
        this._updateTest(jsonTest, targetTest);
    }
    _updateTest(payload, test) {
        test.id = payload.testId;
        test.location = this._absoluteLocation(payload.location);
        test.retries = payload.retries;
        test.tags = payload.tags ?? [];
        test.annotations = payload.annotations ?? [];
        this._absoluteAnnotationLocationsInplace(test.annotations);
        return test;
    }
    _absoluteAnnotationLocationsInplace(annotations) {
        for (const annotation of annotations) {
            if (annotation.location)
                annotation.location = this._absoluteLocation(annotation.location);
        }
    }
    _absoluteLocation(location) {
        if (!location)
            return location;
        return {
            ...location,
            file: this._absolutePath(location.file),
        };
    }
    _absolutePath(relativePath) {
        if (relativePath === undefined)
            return;
        return this._options.resolvePath ? this._options.resolvePath(this._rootDir, relativePath) : this._rootDir + '/' + relativePath;
    }
}
exports.TeleReporterReceiver = TeleReporterReceiver;
class TeleSuite {
    title;
    location;
    parent;
    _entries = [];
    _requireFile = '';
    _timeout;
    _retries;
    _project;
    _parallelMode = 'none';
    _type;
    constructor(title, type) {
        this.title = title;
        this._type = type;
    }
    get type() {
        return this._type;
    }
    get suites() {
        return this._entries.filter(e => e.type !== 'test');
    }
    get tests() {
        return this._entries.filter(e => e.type === 'test');
    }
    entries() {
        return this._entries;
    }
    allTests() {
        const result = [];
        const visit = (suite) => {
            for (const entry of suite.entries()) {
                if (entry.type === 'test')
                    result.push(entry);
                else
                    visit(entry);
            }
        };
        visit(this);
        return result;
    }
    titlePath() {
        const titlePath = this.parent ? this.parent.titlePath() : [];
        // Ignore anonymous describe blocks.
        if (this.title || this._type !== 'describe')
            titlePath.push(this.title);
        return titlePath;
    }
    project() {
        return this._project ?? this.parent?.project();
    }
    _addTest(test) {
        test.parent = this;
        this._entries.push(test);
    }
    _addSuite(suite) {
        suite.parent = this;
        this._entries.push(suite);
    }
}
exports.TeleSuite = TeleSuite;
class TeleTestCase {
    title;
    fn = () => { };
    results = [];
    location;
    parent;
    type = 'test';
    expectedStatus = 'passed';
    timeout = 0;
    annotations = [];
    retries = 0;
    tags = [];
    repeatEachIndex = 0;
    id;
    constructor(id, title, location, repeatEachIndex) {
        this.id = id;
        this.title = title;
        this.location = location;
        this.repeatEachIndex = repeatEachIndex;
    }
    titlePath() {
        const titlePath = this.parent ? this.parent.titlePath() : [];
        titlePath.push(this.title);
        return titlePath;
    }
    outcome() {
        return computeTestCaseOutcome(this);
    }
    ok() {
        const status = this.outcome();
        return status === 'expected' || status === 'flaky' || status === 'skipped';
    }
    _createTestResult(id) {
        const result = new TeleTestResult(this.results.length, id);
        this.results.push(result);
        return result;
    }
}
exports.TeleTestCase = TeleTestCase;
class TeleTestStep {
    title;
    category;
    location;
    parent;
    duration = -1;
    steps = [];
    error;
    _result;
    _endPayload;
    _startTime = 0;
    constructor(payload, parentStep, location, result) {
        this.title = payload.title;
        this.category = payload.category;
        this.location = location;
        this.parent = parentStep;
        this._startTime = payload.startTime;
        this._result = result;
    }
    titlePath() {
        const parentPath = this.parent?.titlePath() || [];
        return [...parentPath, this.title];
    }
    get startTime() {
        return new Date(this._startTime);
    }
    set startTime(value) {
        this._startTime = +value;
    }
    get attachments() {
        return this._endPayload?.attachments?.map(index => this._result.attachments[index]) ?? [];
    }
    get annotations() {
        return this._endPayload?.annotations ?? [];
    }
}
class TeleTestResult {
    retry;
    parallelIndex = -1;
    workerIndex = -1;
    duration = -1;
    stdout = [];
    stderr = [];
    attachments = [];
    annotations = [];
    status = 'skipped';
    steps = [];
    errors = [];
    error;
    _stepMap = new Map();
    _id;
    _startTime = 0;
    constructor(retry, id) {
        this.retry = retry;
        this._id = id;
    }
    setStartTimeNumber(startTime) {
        this._startTime = startTime;
    }
    get startTime() {
        return new Date(this._startTime);
    }
    set startTime(value) {
        this._startTime = +value;
    }
}
exports.TeleTestResult = TeleTestResult;
exports.baseFullConfig = {
    forbidOnly: false,
    fullyParallel: false,
    globalSetup: null,
    globalTeardown: null,
    globalTimeout: 0,
    grep: /.*/,
    grepInvert: null,
    maxFailures: 0,
    metadata: {},
    preserveOutput: 'always',
    projects: [],
    reporter: [[process.env.CI ? 'dot' : 'list']],
    reportSlowTests: { max: 5, threshold: 300_000 /* 5 minutes */ },
    configFile: '',
    rootDir: '',
    quiet: false,
    shard: null,
    tags: [],
    updateSnapshots: 'missing',
    updateSourceMethod: 'patch',
    runAgents: 'none',
    version: '',
    workers: 0,
    webServer: null,
};
function serializeRegexPatterns(patterns) {
    if (!Array.isArray(patterns))
        patterns = [patterns];
    return patterns.map(s => {
        if (typeof s === 'string')
            return { s };
        return { r: { source: s.source, flags: s.flags } };
    });
}
function parseRegexPatterns(patterns) {
    return patterns.map(p => {
        if (p.s !== undefined)
            return p.s;
        return new RegExp(p.r.source, p.r.flags);
    });
}
function computeTestCaseOutcome(test) {
    let skipped = 0;
    let didNotRun = 0;
    let expected = 0;
    let interrupted = 0;
    let unexpected = 0;
    for (const result of test.results) {
        if (result.status === 'interrupted') {
            ++interrupted; // eslint-disable-line @typescript-eslint/no-unused-vars
        }
        else if (result.status === 'skipped' && test.expectedStatus === 'skipped') {
            // Only tests "expected to be skipped" are skipped. These were specifically
            // marked with test.skip or test.fixme.
            ++skipped;
        }
        else if (result.status === 'skipped') {
            // Tests that were expected to run, but were skipped are "did not run".
            // This happens when:
            // - testing finished early;
            // - test failure prevented other tests in the serial suite to run;
            // - probably more cases!
            ++didNotRun; // eslint-disable-line @typescript-eslint/no-unused-vars
        }
        else if (result.status === test.expectedStatus) {
            // Either passed and expected to pass, or failed and expected to fail.
            ++expected;
        }
        else {
            ++unexpected;
        }
    }
    // Tests that were "skipped as expected" are considered equal to "expected" below,
    // because that's the expected outcome.
    //
    // However, we specifically differentiate the case of "only skipped"
    // and show it as "skipped" in all reporters.
    //
    // More exotic cases like "failed on first run and skipped on retry" are flaky.
    if (expected === 0 && unexpected === 0)
        return 'skipped'; // all results were skipped or interrupted
    if (unexpected === 0)
        return 'expected'; // no failures, just expected+skipped
    if (expected === 0 && skipped === 0)
        return 'unexpected'; // only failures
    return 'flaky'; // expected+unexpected or skipped+unexpected
}
function asFullResult(result) {
    return {
        status: result.status,
        startTime: new Date(result.startTime),
        duration: result.duration,
    };
}
function asFullConfig(config) {
    return { ...exports.baseFullConfig, ...config };
}
