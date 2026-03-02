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
exports.waitForCompletion = waitForCompletion;
exports.callOnPageNoTrace = callOnPageNoTrace;
exports.eventWaiter = eventWaiter;
async function waitForCompletion(tab, callback) {
    const requests = [];
    const requestListener = (request) => requests.push(request);
    const disposeListeners = () => {
        tab.page.off('request', requestListener);
    };
    tab.page.on('request', requestListener);
    let result;
    try {
        result = await callback();
        await tab.waitForTimeout(500);
    }
    finally {
        disposeListeners();
    }
    const requestedNavigation = requests.some(request => request.isNavigationRequest());
    if (requestedNavigation) {
        await tab.page.mainFrame().waitForLoadState('load', { timeout: 10000 }).catch(() => { });
        return result;
    }
    const promises = [];
    for (const request of requests) {
        if (['document', 'stylesheet', 'script', 'xhr', 'fetch'].includes(request.resourceType()))
            promises.push(request.response().then(r => r?.finished()).catch(() => { }));
        else
            promises.push(request.response().catch(() => { }));
    }
    const timeout = new Promise(resolve => setTimeout(resolve, 5000));
    await Promise.race([Promise.all(promises), timeout]);
    if (requests.length)
        await tab.waitForTimeout(500);
    return result;
}
async function callOnPageNoTrace(page, callback) {
    return await page._wrapApiCall(() => callback(page), { internal: true });
}
function eventWaiter(page, event, timeout) {
    const disposables = [];
    const eventPromise = new Promise((resolve, reject) => {
        page.on(event, resolve);
        disposables.push(() => page.off(event, resolve));
    });
    let abort;
    const abortPromise = new Promise((resolve, reject) => {
        abort = () => resolve(undefined);
    });
    const timeoutPromise = new Promise(f => {
        const timeoutId = setTimeout(() => f(undefined), timeout);
        disposables.push(() => clearTimeout(timeoutId));
    });
    return {
        promise: Promise.race([eventPromise, abortPromise, timeoutPromise]).finally(() => disposables.forEach(dispose => dispose())),
        abort: abort
    };
}
