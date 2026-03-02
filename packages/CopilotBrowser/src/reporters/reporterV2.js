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
exports.wrapReporterAsV2 = wrapReporterAsV2;
function wrapReporterAsV2(reporter) {
    try {
        if ('version' in reporter && reporter.version() === 'v2')
            return reporter;
    }
    catch (e) {
    }
    return new ReporterV2Wrapper(reporter);
}
class ReporterV2Wrapper {
    _reporter;
    _deferred = [];
    _config;
    constructor(reporter) {
        this._reporter = reporter;
    }
    version() {
        return 'v2';
    }
    onConfigure(config) {
        this._config = config;
    }
    onBegin(suite) {
        this._reporter.onBegin?.(this._config, suite);
        const deferred = this._deferred;
        this._deferred = null;
        for (const item of deferred) {
            if (item.error)
                this.onError(item.error);
            if (item.stdout)
                this.onStdOut(item.stdout.chunk, item.stdout.test, item.stdout.result);
            if (item.stderr)
                this.onStdErr(item.stderr.chunk, item.stderr.test, item.stderr.result);
        }
    }
    onTestBegin(test, result) {
        this._reporter.onTestBegin?.(test, result);
    }
    onStdOut(chunk, test, result) {
        if (this._deferred) {
            this._deferred.push({ stdout: { chunk, test, result } });
            return;
        }
        this._reporter.onStdOut?.(chunk, test, result);
    }
    onStdErr(chunk, test, result) {
        if (this._deferred) {
            this._deferred.push({ stderr: { chunk, test, result } });
            return;
        }
        this._reporter.onStdErr?.(chunk, test, result);
    }
    onTestEnd(test, result) {
        this._reporter.onTestEnd?.(test, result);
    }
    async onEnd(result) {
        return await this._reporter.onEnd?.(result);
    }
    async onExit() {
        await this._reporter.onExit?.();
    }
    onError(error) {
        if (this._deferred) {
            this._deferred.push({ error });
            return;
        }
        this._reporter.onError?.(error);
    }
    onStepBegin(test, result, step) {
        this._reporter.onStepBegin?.(test, result, step);
    }
    onStepEnd(test, result, step) {
        this._reporter.onStepEnd?.(test, result, step);
    }
    printsToStdio() {
        return this._reporter.printsToStdio ? this._reporter.printsToStdio() : true;
    }
}
