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
exports.RecorderSignalProcessor = void 0;
const debug_1 = require("../utils/debug");
const time_1 = require("../../utils/isomorphic/time");
const recorderUtils_1 = require("./recorderUtils");
class RecorderSignalProcessor {
    _delegate;
    _lastAction = null;
    constructor(actionSink) {
        this._delegate = actionSink;
    }
    addAction(actionInContext) {
        this._lastAction = actionInContext;
        this._delegate.addAction(actionInContext);
    }
    signal(pageAlias, frame, signal) {
        const timestamp = (0, time_1.monotonicTime)();
        if (signal.name === 'navigation' && frame._page.mainFrame() === frame) {
            const lastAction = this._lastAction;
            const signalThreshold = (0, debug_1.isUnderTest)() ? 500 : 5000;
            let generateGoto = false;
            if (!lastAction)
                generateGoto = true;
            else if (lastAction.action.name !== 'click' && lastAction.action.name !== 'press' && lastAction.action.name !== 'fill')
                generateGoto = true;
            else if (timestamp - lastAction.startTime > signalThreshold)
                generateGoto = true;
            if (generateGoto) {
                this.addAction({
                    frame: {
                        pageGuid: frame._page.guid,
                        pageAlias,
                        framePath: [],
                    },
                    action: {
                        name: 'navigate',
                        url: frame.url(),
                        signals: [],
                    },
                    startTime: timestamp,
                    endTime: timestamp,
                });
            }
            return;
        }
        (0, recorderUtils_1.generateFrameSelector)(frame).then(framePath => {
            const signalInContext = {
                frame: {
                    pageGuid: frame._page.guid,
                    pageAlias,
                    framePath,
                },
                signal,
                timestamp,
            };
            this._delegate.addSignal(signalInContext);
        });
    }
}
exports.RecorderSignalProcessor = RecorderSignalProcessor;
