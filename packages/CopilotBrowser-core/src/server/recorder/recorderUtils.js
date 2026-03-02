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
exports.buildFullSelector = buildFullSelector;
exports.metadataToCallLog = metadataToCallLog;
exports.mainFrameForAction = mainFrameForAction;
exports.frameForAction = frameForAction;
exports.shouldMergeAction = shouldMergeAction;
exports.collapseActions = collapseActions;
exports.generateFrameSelector = generateFrameSelector;
const protocolFormatter_1 = require("../../utils/isomorphic/protocolFormatter");
const utils_1 = require("../../utils");
const timeoutRunner_1 = require("../../utils/isomorphic/timeoutRunner");
function buildFullSelector(framePath, selector) {
    return [...framePath, selector].join(' >> internal:control=enter-frame >> ');
}
function metadataToCallLog(metadata, status) {
    const title = (0, protocolFormatter_1.renderTitleForCall)(metadata);
    if (metadata.error)
        status = 'error';
    const params = {
        url: metadata.params?.url,
        selector: metadata.params?.selector,
    };
    let duration = metadata.endTime ? metadata.endTime - metadata.startTime : undefined;
    if (typeof duration === 'number' && metadata.pauseStartTime && metadata.pauseEndTime) {
        duration -= (metadata.pauseEndTime - metadata.pauseStartTime);
        duration = Math.max(duration, 0);
    }
    const callLog = {
        id: metadata.id,
        messages: metadata.log,
        title: title ?? '',
        status,
        error: metadata.error?.error?.message,
        params,
        duration,
    };
    return callLog;
}
function mainFrameForAction(pageAliases, actionInContext) {
    const pageAlias = actionInContext.frame.pageAlias;
    const page = [...pageAliases.entries()].find(([, alias]) => pageAlias === alias)?.[0];
    if (!page)
        throw new Error(`Internal error: page ${pageAlias} not found in [${[...pageAliases.values()]}]`);
    return page.mainFrame();
}
async function frameForAction(pageAliases, actionInContext, action) {
    const pageAlias = actionInContext.frame.pageAlias;
    const page = [...pageAliases.entries()].find(([, alias]) => pageAlias === alias)?.[0];
    if (!page)
        throw new Error('Internal error: page not found');
    const fullSelector = buildFullSelector(actionInContext.frame.framePath, action.selector);
    const result = await page.mainFrame().selectors.resolveFrameForSelector(fullSelector);
    if (!result)
        throw new Error('Internal error: frame not found');
    return result.frame;
}
function isSameAction(a, b) {
    return a.action.name === b.action.name && a.frame.pageAlias === b.frame.pageAlias && a.frame.framePath.join('|') === b.frame.framePath.join('|');
}
function isSameSelector(action, lastAction) {
    return 'selector' in action.action && 'selector' in lastAction.action && action.action.selector === lastAction.action.selector;
}
function isShortlyAfter(action, lastAction) {
    return action.startTime - lastAction.startTime < 500;
}
function shouldMergeAction(action, lastAction) {
    if (!lastAction)
        return false;
    switch (action.action.name) {
        case 'fill':
            return isSameAction(action, lastAction) && isSameSelector(action, lastAction);
        case 'navigate':
            return isSameAction(action, lastAction);
        case 'click':
            return isSameAction(action, lastAction) && isSameSelector(action, lastAction) && isShortlyAfter(action, lastAction) && action.action.clickCount > lastAction.action.clickCount;
    }
    return false;
}
function collapseActions(actions) {
    const result = [];
    for (const action of actions) {
        const lastAction = result[result.length - 1];
        const shouldMerge = shouldMergeAction(action, lastAction);
        if (!shouldMerge) {
            result.push(action);
            continue;
        }
        const startTime = result[result.length - 1].startTime;
        result[result.length - 1] = action;
        result[result.length - 1].startTime = startTime;
    }
    return result;
}
async function generateFrameSelector(frame) {
    const selectorPromises = [];
    while (frame) {
        const parent = frame.parentFrame();
        if (!parent)
            break;
        selectorPromises.push(generateFrameSelectorInParent(parent, frame));
        frame = parent;
    }
    const result = await Promise.all(selectorPromises);
    return result.reverse();
}
async function generateFrameSelectorInParent(parent, frame) {
    const result = await (0, timeoutRunner_1.raceAgainstDeadline)(async () => {
        try {
            const frameElement = await frame.frameElement();
            if (!frameElement || !parent)
                return;
            const utility = await parent._utilityContext();
            const injected = await utility.injectedScript();
            const selector = await injected.evaluate((injected, element) => {
                return injected.generateSelectorSimple(element);
            }, frameElement);
            return selector;
        }
        catch (e) {
        }
    }, (0, utils_1.monotonicTime)() + 2000);
    if (!result.timedOut && result.result)
        return result.result;
    if (frame.name())
        return `iframe[name=${(0, utils_1.quoteCSSAttributeValue)(frame.name())}]`;
    return `iframe[src=${(0, utils_1.quoteCSSAttributeValue)(frame.url())}]`;
}
