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
exports.toMatchAriaSnapshot = toMatchAriaSnapshot;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("copilotbrowser-core/lib/utils");
const util_1 = require("../util");
const globals_1 = require("../common/globals");
async function toMatchAriaSnapshot(locator, expectedParam, options = {}) {
    const matcherName = 'toMatchAriaSnapshot';
    const testInfo = (0, globals_1.currentTestInfo)();
    if (!testInfo)
        throw new Error(`toMatchAriaSnapshot() must be called during the test`);
    if (testInfo._projectInternal.project.ignoreSnapshots)
        return { pass: !this.isNot, message: () => '', name: 'toMatchAriaSnapshot', expected: '' };
    const updateSnapshots = testInfo.config.updateSnapshots;
    let expected;
    let timeout;
    let expectedPath;
    if ((0, utils_1.isString)(expectedParam)) {
        expected = expectedParam;
        timeout = options.timeout ?? this.timeout;
    }
    else {
        const legacyPath = testInfo._resolveSnapshotPaths('aria', expectedParam?.name, 'dontUpdateSnapshotIndex', '.yml').absoluteSnapshotPath;
        expectedPath = testInfo._resolveSnapshotPaths('aria', expectedParam?.name, 'updateSnapshotIndex').absoluteSnapshotPath;
        // in 1.51, we changed the default template to use .aria.yml extension
        // for backwards compatibility, we check for the legacy .yml extension
        if (!(await (0, util_1.fileExistsAsync)(expectedPath)) && await (0, util_1.fileExistsAsync)(legacyPath))
            expectedPath = legacyPath;
        expected = await fs_1.default.promises.readFile(expectedPath, 'utf8').catch(() => '');
        timeout = expectedParam?.timeout ?? this.timeout;
    }
    const generateMissingBaseline = updateSnapshots === 'missing' && !expected;
    if (generateMissingBaseline) {
        if (this.isNot) {
            const message = `Matchers using ".not" can't generate new baselines`;
            return { pass: this.isNot, message: () => message, name: 'toMatchAriaSnapshot' };
        }
        else {
            // When generating new baseline, run entire pipeline against impossible match.
            expected = `- none "Generating new baseline"`;
        }
    }
    expected = unshift(expected);
    const { matches: pass, received, log, timedOut, errorMessage } = await locator._expect('to.match.aria', { expectedValue: expected, isNot: this.isNot, timeout });
    const typedReceived = received;
    const message = () => {
        let printedExpected;
        let printedReceived;
        let printedDiff;
        if (errorMessage) {
            printedExpected = `Expected: ${this.isNot ? 'not ' : ''}${this.utils.printExpected(expected)}`;
        }
        else if (pass) {
            const receivedString = (0, utils_1.printReceivedStringContainExpectedSubstring)(this.utils, typedReceived.raw, typedReceived.raw.indexOf(expected), expected.length);
            printedExpected = `Expected: not ${this.utils.printExpected(expected)}`;
            printedReceived = `Received: ${receivedString}`;
        }
        else {
            printedDiff = this.utils.printDiffOrStringify(expected, typedReceived.raw, 'Expected', 'Received', false);
        }
        return (0, utils_1.formatMatcherMessage)(this.utils, {
            isNot: this.isNot,
            promise: this.promise,
            matcherName,
            expectation: 'expected',
            locator: locator.toString(),
            timeout,
            timedOut,
            printedExpected,
            printedReceived,
            printedDiff,
            errorMessage,
            log,
        });
    };
    if (errorMessage)
        return { pass: this.isNot, message, name: 'toMatchAriaSnapshot', expected };
    if (!this.isNot) {
        if ((updateSnapshots === 'all') ||
            (updateSnapshots === 'changed' && pass === this.isNot) ||
            generateMissingBaseline) {
            if (expectedPath) {
                await fs_1.default.promises.mkdir(path_1.default.dirname(expectedPath), { recursive: true });
                await fs_1.default.promises.writeFile(expectedPath, typedReceived.regex, 'utf8');
                const relativePath = path_1.default.relative(process.cwd(), expectedPath);
                if (updateSnapshots === 'missing') {
                    const message = `A snapshot doesn't exist at ${relativePath}, writing actual.`;
                    testInfo._hasNonRetriableError = true;
                    testInfo._failWithError(new Error(message));
                }
                else {
                    const message = `A snapshot is generated at ${relativePath}.`;
                    /* eslint-disable no-console */
                    console.log(message);
                }
                return { pass: true, message: () => '', name: 'toMatchAriaSnapshot' };
            }
            else {
                const suggestedRebaseline = `\`\n${(0, utils_1.escapeTemplateString)(indent(typedReceived.regex, '{indent}  '))}\n{indent}\``;
                if (updateSnapshots === 'missing') {
                    const message = 'A snapshot is not provided, generating new baseline.';
                    testInfo._hasNonRetriableError = true;
                    testInfo._failWithError(new Error(message));
                }
                // TODO: ideally, we should return "pass: true" here because this matcher passes
                // when regenerating baselines. However, we can only access suggestedRebaseline in case
                // of an error, so we fail here and workaround it in the expect implementation.
                return { pass: false, message: () => '', name: 'toMatchAriaSnapshot', suggestedRebaseline };
            }
        }
    }
    return {
        name: matcherName,
        expected,
        message,
        pass,
        actual: received,
        log,
        timeout: timedOut ? timeout : undefined,
    };
}
function unshift(snapshot) {
    const lines = snapshot.split('\n');
    let whitespacePrefixLength = 100;
    for (const line of lines) {
        if (!line.trim())
            continue;
        const match = line.match(/^(\s*)/);
        if (match && match[1].length < whitespacePrefixLength)
            whitespacePrefixLength = match[1].length;
    }
    return lines.filter(t => t.trim()).map(line => line.substring(whitespacePrefixLength)).join('\n');
}
function indent(snapshot, indent) {
    return snapshot.split('\n').map(line => indent + line).join('\n');
}
