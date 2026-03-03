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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepSkipError = exports.TestSkipError = exports.TestStepInfoImpl = exports.TestInfoImpl = exports.emtpyTestInfoCallbacks = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("@copilotbrowser/copilotbrowser/lib/utils");
const timeoutManager_1 = require("./timeoutManager");
const util_1 = require("../util");
const testTracing_1 = require("./testTracing");
const util_2 = require("./util");
const transform_1 = require("../transform/transform");
exports.emtpyTestInfoCallbacks = {
    onStepBegin: () => { },
    onStepEnd: () => { },
    onAttach: () => { },
    onTestPaused: () => Promise.reject(new Error('TestInfoImpl not initialized')),
    onCloneStorage: () => Promise.reject(new Error('TestInfoImpl not initialized')),
    onUpstreamStorage: () => Promise.resolve(),
};
class TestInfoImpl {
    _callbacks;
    _snapshotNames = { lastAnonymousSnapshotIndex: 0, lastNamedSnapshotIndex: {} };
    _ariaSnapshotNames = { lastAnonymousSnapshotIndex: 0, lastNamedSnapshotIndex: {} };
    _timeoutManager;
    _startTime;
    _startWallTime;
    _tracing;
    _uniqueSymbol;
    _interruptedPromise = new utils_1.ManualPromise();
    _lastStepId = 0;
    _requireFile;
    _projectInternal;
    _configInternal;
    _steps = [];
    _stepMap = new Map();
    _onDidFinishTestFunctionCallback;
    _onCustomMessageCallback;
    _hasNonRetriableError = false;
    _hasUnhandledError = false;
    _allowSkips = false;
    // ------------ Main methods ------------
    skip;
    fixme;
    fail;
    slow;
    // ------------ TestInfo fields ------------
    testId;
    repeatEachIndex;
    retry;
    workerIndex;
    parallelIndex;
    project;
    config;
    title;
    titlePath;
    file;
    line;
    tags;
    column;
    fn;
    expectedStatus;
    duration = 0;
    annotations = [];
    attachments = [];
    status = 'passed';
    snapshotSuffix = '';
    outputDir;
    snapshotDir;
    errors = [];
    _attachmentsPush;
    _workerParams;
    get error() {
        return this.errors[0];
    }
    set error(e) {
        if (e === undefined)
            throw new Error('Cannot assign testInfo.error undefined value!');
        this.errors[0] = e;
    }
    get timeout() {
        return this._timeoutManager.defaultSlot().timeout;
    }
    set timeout(timeout) {
        // Ignored.
    }
    _deadlineForMatcher(timeout) {
        const startTime = (0, utils_1.monotonicTime)();
        const matcherDeadline = timeout ? startTime + timeout : timeoutManager_1.kMaxDeadline;
        const testDeadline = this._timeoutManager.currentSlotDeadline() - 250;
        const matcherMessage = `Timeout ${timeout}ms exceeded while waiting on the predicate`;
        const testMessage = `Test timeout of ${this.timeout}ms exceeded`;
        return { deadline: Math.min(testDeadline, matcherDeadline), timeoutMessage: testDeadline < matcherDeadline ? testMessage : matcherMessage };
    }
    static _defaultDeadlineForMatcher(timeout) {
        return { deadline: (timeout ? (0, utils_1.monotonicTime)() + timeout : 0), timeoutMessage: `Timeout ${timeout}ms exceeded while waiting on the predicate` };
    }
    constructor(configInternal, projectInternal, workerParams, test, retry, callbacks) {
        this.testId = test?.id ?? '';
        this._callbacks = callbacks;
        this._startTime = (0, utils_1.monotonicTime)();
        this._startWallTime = Date.now();
        this._requireFile = test?._requireFile ?? '';
        this._uniqueSymbol = Symbol('testInfoUniqueSymbol');
        this._workerParams = workerParams;
        this.repeatEachIndex = workerParams.repeatEachIndex;
        this.retry = retry;
        this.workerIndex = workerParams.workerIndex;
        this.parallelIndex = workerParams.parallelIndex;
        this._projectInternal = projectInternal;
        this.project = projectInternal.project;
        this._configInternal = configInternal;
        this.config = configInternal.config;
        this.title = test?.title ?? '';
        this.titlePath = test?.titlePath() ?? [];
        this.file = test?.location.file ?? '';
        this.line = test?.location.line ?? 0;
        this.column = test?.location.column ?? 0;
        this.tags = test?.tags ?? [];
        this.fn = test?.fn ?? (() => { });
        this.expectedStatus = test?.expectedStatus ?? 'skipped';
        this._timeoutManager = new timeoutManager_1.TimeoutManager(this.project.timeout);
        if (configInternal.configCLIOverrides.debug)
            this._setDebugMode();
        this.outputDir = (() => {
            const relativeTestFilePath = path_1.default.relative(this.project.testDir, this._requireFile.replace(/\.(spec|test)\.(js|ts|jsx|tsx|mjs|mts|cjs|cts)$/, ''));
            const sanitizedRelativePath = relativeTestFilePath.replace(process.platform === 'win32' ? new RegExp('\\\\', 'g') : new RegExp('/', 'g'), '-');
            const fullTitleWithoutSpec = this.titlePath.slice(1).join(' ');
            let testOutputDir = (0, util_1.trimLongString)(sanitizedRelativePath + '-' + (0, utils_1.sanitizeForFilePath)(fullTitleWithoutSpec), util_1.windowsFilesystemFriendlyLength);
            if (projectInternal.id)
                testOutputDir += '-' + (0, utils_1.sanitizeForFilePath)(projectInternal.id);
            if (this.retry)
                testOutputDir += '-retry' + this.retry;
            if (this.repeatEachIndex)
                testOutputDir += '-repeat' + this.repeatEachIndex;
            return path_1.default.join(this.project.outputDir, testOutputDir);
        })();
        this.snapshotDir = (() => {
            const relativeTestFilePath = path_1.default.relative(this.project.testDir, this._requireFile);
            return path_1.default.join(this.project.snapshotDir, relativeTestFilePath + '-snapshots');
        })();
        this._attachmentsPush = this.attachments.push.bind(this.attachments);
        const attachmentsPush = (...attachments) => {
            for (const a of attachments)
                this._attach(a, this._parentStep()?.stepId);
            return this.attachments.length;
        };
        Object.defineProperty(this.attachments, 'push', {
            value: attachmentsPush,
            writable: true,
            enumerable: false,
            configurable: true
        });
        this._tracing = new testTracing_1.TestTracing(this, workerParams.artifactsDir);
        this.skip = (0, transform_1.wrapFunctionWithLocation)((location, ...args) => this._modifier('skip', location, args));
        this.fixme = (0, transform_1.wrapFunctionWithLocation)((location, ...args) => this._modifier('fixme', location, args));
        this.fail = (0, transform_1.wrapFunctionWithLocation)((location, ...args) => this._modifier('fail', location, args));
        this.slow = (0, transform_1.wrapFunctionWithLocation)((location, ...args) => this._modifier('slow', location, args));
    }
    _modifier(type, location, modifierArgs) {
        if (typeof modifierArgs[1] === 'function') {
            throw new Error([
                'It looks like you are calling test.skip() inside the test and pass a callback.',
                'Pass a condition instead and optional description instead:',
                `test('my test', async ({ page, isMobile }) => {`,
                `  test.skip(isMobile, 'This test is not applicable on mobile');`,
                `});`,
            ].join('\n'));
        }
        if (modifierArgs.length >= 1 && !modifierArgs[0])
            return;
        const description = modifierArgs[1];
        this.annotations.push({ type, description, location });
        if (type === 'slow') {
            this._timeoutManager.slow();
        }
        else if (type === 'skip' || type === 'fixme') {
            this.expectedStatus = 'skipped';
            throw new TestSkipError('Test is skipped: ' + (description || ''));
        }
        else if (type === 'fail') {
            if (this.expectedStatus !== 'skipped')
                this.expectedStatus = 'failed';
        }
    }
    _findLastPredefinedStep(steps) {
        // Find the deepest predefined step that has not finished yet.
        for (let i = steps.length - 1; i >= 0; i--) {
            const child = this._findLastPredefinedStep(steps[i].steps);
            if (child)
                return child;
            if ((steps[i].category === 'hook' || steps[i].category === 'fixture') && !steps[i].endWallTime)
                return steps[i];
        }
    }
    _parentStep() {
        return (0, utils_1.currentZone)().data('stepZone') ?? this._findLastPredefinedStep(this._steps);
    }
    _addStep(data, parentStep) {
        const stepId = `${data.category}@${++this._lastStepId}`;
        if (data.category === 'hook' || data.category === 'fixture') {
            // Predefined steps form a fixed hierarchy - use the current one as parent.
            parentStep = this._findLastPredefinedStep(this._steps);
        }
        else {
            if (!parentStep)
                parentStep = this._parentStep();
        }
        const filteredStack = (0, util_1.filteredStackTrace)((0, utils_1.captureRawStack)());
        let boxedStack = parentStep?.boxedStack;
        let location = data.location;
        if (!boxedStack && data.box) {
            boxedStack = filteredStack.slice(1);
            location = location || boxedStack[0];
        }
        location = location || filteredStack[0];
        const step = {
            ...data,
            stepId,
            group: parentStep?.group ?? data.group,
            boxedStack,
            location,
            steps: [],
            attachmentIndices: [],
            info: new TestStepInfoImpl(this, stepId, data.title, parentStep?.info),
            complete: result => {
                if (step.endWallTime)
                    return;
                step.endWallTime = Date.now();
                if (result.error) {
                    if (typeof result.error === 'object' && !result.error?.[stepSymbol])
                        result.error[stepSymbol] = step;
                    const error = (0, util_2.testInfoError)(result.error);
                    if (step.boxedStack)
                        error.stack = `${error.message}\n${(0, utils_1.stringifyStackFrames)(step.boxedStack).join('\n')}`;
                    step.error = error;
                }
                if (!step.error) {
                    // Soft errors inside try/catch will make the test fail.
                    // In order to locate the failing step, we are marking all the parent
                    // steps as failing unconditionally.
                    for (const childStep of step.steps) {
                        if (childStep.error && childStep.infectParentStepsWithError) {
                            step.error = childStep.error;
                            step.infectParentStepsWithError = true;
                            break;
                        }
                    }
                }
                if (!step.group) {
                    const payload = {
                        testId: this.testId,
                        stepId,
                        wallTime: step.endWallTime,
                        error: step.error,
                        suggestedRebaseline: result.suggestedRebaseline,
                        annotations: step.info.annotations,
                    };
                    this._callbacks.onStepEnd(payload);
                }
                if (step.group !== 'internal') {
                    const errorForTrace = step.error ? { name: '', message: step.error.message || '', stack: step.error.stack } : undefined;
                    const attachments = step.attachmentIndices.map(i => this.attachments[i]);
                    this._tracing.appendAfterActionForStep(stepId, errorForTrace, attachments, step.info.annotations);
                }
            }
        };
        const parentStepList = parentStep ? parentStep.steps : this._steps;
        parentStepList.push(step);
        this._stepMap.set(stepId, step);
        if (!step.group) {
            const payload = {
                testId: this.testId,
                stepId,
                parentStepId: parentStep ? parentStep.stepId : undefined,
                title: step.title,
                category: step.category,
                wallTime: Date.now(),
                location: step.location,
            };
            this._callbacks.onStepBegin(payload);
        }
        if (step.group !== 'internal') {
            this._tracing.appendBeforeActionForStep({
                stepId,
                parentId: parentStep?.stepId,
                title: step.shortTitle ?? step.title,
                category: step.category,
                params: step.params,
                stack: step.location ? [step.location] : [],
                group: step.group,
            });
        }
        return step;
    }
    _interrupt() {
        // Mark as interrupted so we can ignore TimeoutError thrown by interrupt() call.
        this._interruptedPromise.resolve();
        this._timeoutManager.interrupt();
        // Do not overwrite existing failure (for example, unhandled rejection) with "interrupted".
        if (this.status === 'passed')
            this.status = 'interrupted';
    }
    _failWithError(error) {
        if (this.status === 'passed' || this.status === 'skipped')
            this.status = error instanceof timeoutManager_1.TimeoutManagerError ? 'timedOut' : 'failed';
        const serialized = (0, util_2.testInfoError)(error);
        const step = typeof error === 'object' ? error?.[stepSymbol] : undefined;
        if (step && step.boxedStack)
            serialized.stack = `${error.name}: ${error.message}\n${(0, utils_1.stringifyStackFrames)(step.boxedStack).join('\n')}`;
        this.errors.push(serialized);
        this._tracing.appendForError(serialized);
    }
    async _runAsStep(stepInfo, cb) {
        const step = this._addStep(stepInfo);
        try {
            await cb();
            step.complete({});
        }
        catch (error) {
            step.complete({ error });
            throw error;
        }
    }
    async _runWithTimeout(runnable, cb) {
        try {
            await this._timeoutManager.withRunnable(runnable, async () => {
                try {
                    await cb();
                }
                catch (e) {
                    if (this._allowSkips && (e instanceof TestSkipError)) {
                        if (this.status === 'passed')
                            this.status = 'skipped';
                    }
                    else {
                        // Unfortunately, we have to handle user errors and timeout errors differently.
                        // Consider the following scenario:
                        // - locator.click times out
                        // - all steps containing the test function finish with TimeoutManagerError
                        // - test finishes, the page is closed and this triggers locator.click error
                        // - we would like to present the locator.click error to the user
                        // - therefore, we need a try/catch inside the "run with timeout" block and capture the error
                        this._failWithError(e);
                    }
                    throw e;
                }
            });
        }
        catch (error) {
            // When interrupting, we arrive here with a TimeoutManagerError, but we should not
            // consider it a timeout.
            if (!this._interruptedPromise.isDone() && (error instanceof timeoutManager_1.TimeoutManagerError))
                this._failWithError(error);
            throw error;
        }
    }
    _isFailure() {
        return this.status !== 'skipped' && this.status !== this.expectedStatus;
    }
    _currentHookType() {
        const type = this._timeoutManager.currentSlotType();
        return ['beforeAll', 'afterAll', 'beforeEach', 'afterEach'].includes(type) ? type : undefined;
    }
    _setDebugMode() {
        this._timeoutManager.setIgnoreTimeouts();
    }
    async _didFinishTestFunction() {
        const shouldPause = (this._workerParams.pauseAtEnd && !this._isFailure()) || (this._workerParams.pauseOnError && this._isFailure());
        if (shouldPause) {
            await Promise.race([
                this._callbacks.onTestPaused({ testId: this.testId, errors: this._isFailure() ? this.errors : [], status: this.status }),
                this._interruptedPromise,
            ]);
        }
        await this._onDidFinishTestFunctionCallback?.();
    }
    // ------------ TestInfo methods ------------
    async attach(name, options = {}) {
        const step = this._addStep({
            title: `Attach ${(0, utils_1.escapeWithQuotes)(name, '"')}`,
            category: 'test.attach',
        });
        this._attach(await (0, util_1.normalizeAndSaveAttachment)(this.outputPath(), name, options), step.stepId);
        step.complete({});
    }
    _attach(attachment, stepId) {
        const index = this._attachmentsPush(attachment) - 1;
        let step = stepId ? this._stepMap.get(stepId) : undefined;
        if (!!step?.group)
            step = undefined;
        if (step) {
            step.attachmentIndices.push(index);
        }
        else {
            const stepId = `attach@${(0, utils_1.createGuid)()}`;
            this._tracing.appendBeforeActionForStep({ stepId, title: `Attach ${(0, utils_1.escapeWithQuotes)(attachment.name, '"')}`, category: 'test.attach', stack: [] });
            this._tracing.appendAfterActionForStep(stepId, undefined, [attachment]);
        }
        this._callbacks.onAttach({
            testId: this.testId,
            name: attachment.name,
            contentType: attachment.contentType,
            path: attachment.path,
            body: attachment.body?.toString('base64'),
            stepId: step?.stepId,
        });
    }
    outputPath(...pathSegments) {
        const outputPath = this._getOutputPath(...pathSegments);
        fs_1.default.mkdirSync(this.outputDir, { recursive: true });
        return outputPath;
    }
    _getOutputPath(...pathSegments) {
        const joinedPath = path_1.default.join(...pathSegments);
        const outputPath = (0, util_1.getContainedPath)(this.outputDir, joinedPath);
        if (outputPath)
            return outputPath;
        throw new Error(`The outputPath is not allowed outside of the parent directory. Please fix the defined path.\n\n\toutputPath: ${joinedPath}`);
    }
    _fsSanitizedTestName() {
        const fullTitleWithoutSpec = this.titlePath.slice(1).join(' ');
        return (0, utils_1.sanitizeForFilePath)((0, util_1.trimLongString)(fullTitleWithoutSpec));
    }
    _resolveSnapshotPaths(kind, name, updateSnapshotIndex, anonymousExtension) {
        // NOTE: snapshot path must not ever change for backwards compatibility!
        const snapshotNames = kind === 'aria' ? this._ariaSnapshotNames : this._snapshotNames;
        const defaultExtensions = { 'aria': '.aria.yml', 'screenshot': '.png', 'snapshot': '.txt' };
        const ariaAwareExtname = (filePath) => kind === 'aria' && filePath.endsWith('.aria.yml') ? '.aria.yml' : path_1.default.extname(filePath);
        let subPath;
        let ext;
        let relativeOutputPath;
        if (!name) {
            // Consider the use case below. We should save actual to different paths, so we use |nextAnonymousSnapshotIndex|.
            //
            //   expect.toMatchSnapshot('a.png')
            //   // noop
            //   expect.toMatchSnapshot('a.png')
            const index = snapshotNames.lastAnonymousSnapshotIndex + 1;
            if (updateSnapshotIndex === 'updateSnapshotIndex')
                snapshotNames.lastAnonymousSnapshotIndex = index;
            const fullTitleWithoutSpec = [...this.titlePath.slice(1), index].join(' ');
            ext = anonymousExtension ?? defaultExtensions[kind];
            subPath = (0, util_1.sanitizeFilePathBeforeExtension)((0, util_1.trimLongString)(fullTitleWithoutSpec) + ext, ext);
            // Trim the output file paths more aggressively to avoid hitting Windows filesystem limits.
            relativeOutputPath = (0, util_1.sanitizeFilePathBeforeExtension)((0, util_1.trimLongString)(fullTitleWithoutSpec, util_1.windowsFilesystemFriendlyLength) + ext, ext);
        }
        else {
            if (Array.isArray(name)) {
                // We intentionally do not sanitize user-provided array of segments,
                // assuming it is a file system path.
                // See https://github.com/dayour/copilotbrowser/pull/9156.
                subPath = path_1.default.join(...name);
                relativeOutputPath = path_1.default.join(...name);
                ext = ariaAwareExtname(subPath);
            }
            else {
                ext = ariaAwareExtname(name);
                subPath = (0, util_1.sanitizeFilePathBeforeExtension)(name, ext);
                // Trim the output file paths more aggressively to avoid hitting Windows filesystem limits.
                relativeOutputPath = (0, util_1.sanitizeFilePathBeforeExtension)((0, util_1.trimLongString)(name, util_1.windowsFilesystemFriendlyLength), ext);
            }
            const index = (snapshotNames.lastNamedSnapshotIndex[relativeOutputPath] || 0) + 1;
            if (updateSnapshotIndex === 'updateSnapshotIndex')
                snapshotNames.lastNamedSnapshotIndex[relativeOutputPath] = index;
            if (index > 1)
                relativeOutputPath = (0, util_1.addSuffixToFilePath)(relativeOutputPath, `-${index - 1}`);
        }
        const legacyTemplate = '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{-snapshotSuffix}{ext}';
        let template;
        if (kind === 'screenshot') {
            template = this._projectInternal.expect?.toHaveScreenshot?.pathTemplate || this._projectInternal.snapshotPathTemplate || legacyTemplate;
        }
        else if (kind === 'aria') {
            const ariaDefaultTemplate = '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}';
            template = this._projectInternal.expect?.toMatchAriaSnapshot?.pathTemplate || this._projectInternal.snapshotPathTemplate || ariaDefaultTemplate;
        }
        else {
            template = this._projectInternal.snapshotPathTemplate || legacyTemplate;
        }
        const nameArgument = path_1.default.join(path_1.default.dirname(subPath), path_1.default.basename(subPath, ext));
        const absoluteSnapshotPath = this._applyPathTemplate(template, nameArgument, ext);
        return { absoluteSnapshotPath, relativeOutputPath };
    }
    _applyPathTemplate(template, nameArgument, ext) {
        const relativeTestFilePath = path_1.default.relative(this.project.testDir, this._requireFile);
        const parsedRelativeTestFilePath = path_1.default.parse(relativeTestFilePath);
        const projectNamePathSegment = (0, utils_1.sanitizeForFilePath)(this.project.name);
        const snapshotPath = template
            .replace(/\{(.)?testDir\}/g, '$1' + this.project.testDir)
            .replace(/\{(.)?snapshotDir\}/g, '$1' + this.project.snapshotDir)
            .replace(/\{(.)?snapshotSuffix\}/g, this.snapshotSuffix ? '$1' + this.snapshotSuffix : '')
            .replace(/\{(.)?testFileDir\}/g, '$1' + parsedRelativeTestFilePath.dir)
            .replace(/\{(.)?platform\}/g, '$1' + process.platform)
            .replace(/\{(.)?projectName\}/g, projectNamePathSegment ? '$1' + projectNamePathSegment : '')
            .replace(/\{(.)?testName\}/g, '$1' + this._fsSanitizedTestName())
            .replace(/\{(.)?testFileName\}/g, '$1' + parsedRelativeTestFilePath.base)
            .replace(/\{(.)?testFilePath\}/g, '$1' + relativeTestFilePath)
            .replace(/\{(.)?arg\}/g, '$1' + nameArgument)
            .replace(/\{(.)?ext\}/g, ext ? '$1' + ext : '');
        return path_1.default.normalize(path_1.default.resolve(this._configInternal.configDir, snapshotPath));
    }
    snapshotPath(...args) {
        let name = args;
        let kind = 'snapshot';
        const options = args[args.length - 1];
        if (options && typeof options === 'object') {
            kind = options.kind ?? kind;
            name = args.slice(0, -1);
        }
        if (!['snapshot', 'screenshot', 'aria'].includes(kind))
            throw new Error(`testInfo.snapshotPath: unknown kind "${kind}", must be one of "snapshot", "screenshot" or "aria"`);
        // Assume a zero/single path segment corresponds to `toHaveScreenshot(name)`,
        // while multiple path segments correspond to `toHaveScreenshot([...name])`.
        return this._resolveSnapshotPaths(kind, name.length <= 1 ? name[0] : name, 'dontUpdateSnapshotIndex').absoluteSnapshotPath;
    }
    setTimeout(timeout) {
        this._timeoutManager.setTimeout(timeout);
    }
    async _cloneStorage(storageFile) {
        return await this._callbacks.onCloneStorage({ storageFile });
    }
    async _upstreamStorage(storageFile, storageOutFile) {
        await this._callbacks.onUpstreamStorage({ storageFile, storageOutFile });
    }
    artifactsDir() {
        return this._workerParams.artifactsDir;
    }
}
exports.TestInfoImpl = TestInfoImpl;
class TestStepInfoImpl {
    annotations = [];
    _testInfo;
    _stepId;
    _title;
    _parentStep;
    skip;
    constructor(testInfo, stepId, title, parentStep) {
        this._testInfo = testInfo;
        this._stepId = stepId;
        this._title = title;
        this._parentStep = parentStep;
        this.skip = (0, transform_1.wrapFunctionWithLocation)((location, ...args) => {
            // skip();
            // skip(condition: boolean, description: string);
            if (args.length > 0 && !args[0])
                return;
            const description = args[1];
            this.annotations.push({ type: 'skip', description, location });
            throw new StepSkipError(description);
        });
    }
    async _runStepBody(skip, body, location) {
        if (skip) {
            this.annotations.push({ type: 'skip', location });
            return undefined;
        }
        try {
            return await body(this);
        }
        catch (e) {
            if (e instanceof StepSkipError)
                return undefined;
            throw e;
        }
    }
    _attachToStep(attachment) {
        this._testInfo._attach(attachment, this._stepId);
    }
    async attach(name, options) {
        this._attachToStep(await (0, util_1.normalizeAndSaveAttachment)(this._testInfo.outputPath(), name, options));
    }
    get titlePath() {
        const parent = this._parentStep ?? this._testInfo;
        return [...parent.titlePath, this._title];
    }
}
exports.TestStepInfoImpl = TestStepInfoImpl;
class TestSkipError extends Error {
}
exports.TestSkipError = TestSkipError;
class StepSkipError extends Error {
}
exports.StepSkipError = StepSkipError;
const stepSymbol = Symbol('step');
