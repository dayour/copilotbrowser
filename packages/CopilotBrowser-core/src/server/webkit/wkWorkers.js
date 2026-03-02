"use strict";
/**
 * Copyright 2019 Microsoft Corporation All rights reserved.
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
exports.WKWorkers = void 0;
const eventsHelper_1 = require("../utils/eventsHelper");
const page_1 = require("../page");
const wkConnection_1 = require("./wkConnection");
const wkExecutionContext_1 = require("./wkExecutionContext");
class WKWorkers {
    _sessionListeners = [];
    _page;
    _workerSessions = new Map();
    constructor(page) {
        this._page = page;
    }
    setSession(session) {
        eventsHelper_1.eventsHelper.removeEventListeners(this._sessionListeners);
        this.clear();
        this._sessionListeners = [
            eventsHelper_1.eventsHelper.addEventListener(session, 'Worker.workerCreated', (event) => {
                const worker = new page_1.Worker(this._page, event.url);
                const workerSession = new wkConnection_1.WKSession(session.connection, event.workerId, (message) => {
                    session.send('Worker.sendMessageToWorker', {
                        workerId: event.workerId,
                        message: JSON.stringify(message)
                    }).catch(e => {
                        workerSession.dispatchMessage({ id: message.id, error: { message: e.message } });
                    });
                });
                this._workerSessions.set(event.workerId, workerSession);
                worker.createExecutionContext(new wkExecutionContext_1.WKExecutionContext(workerSession, undefined));
                worker.workerScriptLoaded();
                this._page.addWorker(event.workerId, worker);
                workerSession.on('Console.messageAdded', event => this._onConsoleMessage(worker, event));
                Promise.all([
                    workerSession.send('Runtime.enable'),
                    workerSession.send('Console.enable'),
                    session.send('Worker.initialized', { workerId: event.workerId })
                ]).catch(e => {
                    // Worker can go as we are initializing it.
                    this._page.removeWorker(event.workerId);
                });
            }),
            eventsHelper_1.eventsHelper.addEventListener(session, 'Worker.dispatchMessageFromWorker', (event) => {
                const workerSession = this._workerSessions.get(event.workerId);
                if (!workerSession)
                    return;
                workerSession.dispatchMessage(JSON.parse(event.message));
            }),
            eventsHelper_1.eventsHelper.addEventListener(session, 'Worker.workerTerminated', (event) => {
                const workerSession = this._workerSessions.get(event.workerId);
                if (!workerSession)
                    return;
                workerSession.dispose();
                this._workerSessions.delete(event.workerId);
                this._page.removeWorker(event.workerId);
            })
        ];
    }
    clear() {
        this._page.clearWorkers();
        this._workerSessions.clear();
    }
    async initializeSession(session) {
        await session.send('Worker.enable');
    }
    async _onConsoleMessage(worker, event) {
        const { type, level, text, parameters, url, line: lineNumber, column: columnNumber } = event.message;
        let derivedType = type || '';
        if (type === 'log')
            derivedType = level;
        else if (type === 'timing')
            derivedType = 'timeEnd';
        const handles = (parameters || []).map(p => {
            return (0, wkExecutionContext_1.createHandle)(worker.existingExecutionContext, p);
        });
        const location = {
            url: url || '',
            lineNumber: (lineNumber || 1) - 1,
            columnNumber: (columnNumber || 1) - 1
        };
        const timestamp = event.message.timestamp ? event.message.timestamp * 1000 : Date.now();
        this._page.addConsoleMessage(worker, derivedType, handles, location, handles.length ? undefined : text, timestamp);
    }
}
exports.WKWorkers = WKWorkers;
