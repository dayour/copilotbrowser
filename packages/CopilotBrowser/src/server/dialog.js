"use strict";
/**
 * Copyright 2017 Google Inc. All rights reserved.
 * Modifications copyright (c) Microsoft Corporation.
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
exports.DialogManager = exports.Dialog = void 0;
const utils_1 = require("../utils");
const instrumentation_1 = require("./instrumentation");
class Dialog extends instrumentation_1.SdkObject {
    _page;
    _type;
    _message;
    _onHandle;
    _handled = false;
    _defaultValue;
    constructor(page, type, message, onHandle, defaultValue) {
        super(page, 'dialog');
        this._page = page;
        this._type = type;
        this._message = message;
        this._onHandle = onHandle;
        this._defaultValue = defaultValue || '';
    }
    page() {
        return this._page;
    }
    type() {
        return this._type;
    }
    message() {
        return this._message;
    }
    defaultValue() {
        return this._defaultValue;
    }
    async accept(promptText) {
        (0, utils_1.assert)(!this._handled, 'Cannot accept dialog which is already handled!');
        this._handled = true;
        this._page.browserContext.dialogManager.dialogWillClose(this);
        await this._onHandle(true, promptText);
    }
    async dismiss() {
        (0, utils_1.assert)(!this._handled, 'Cannot dismiss dialog which is already handled!');
        this._handled = true;
        this._page.browserContext.dialogManager.dialogWillClose(this);
        await this._onHandle(false);
    }
    async close() {
        if (this._type === 'beforeunload')
            await this.accept();
        else
            await this.dismiss();
    }
}
exports.Dialog = Dialog;
class DialogManager {
    _instrumentation;
    _dialogHandlers = new Set();
    _openedDialogs = new Set();
    constructor(instrumentation) {
        this._instrumentation = instrumentation;
    }
    dialogDidOpen(dialog) {
        // Any ongoing evaluations will be stalled until the dialog is closed.
        for (const frame of dialog.page().frameManager.frames())
            frame._invalidateNonStallingEvaluations('JavaScript dialog interrupted evaluation');
        this._openedDialogs.add(dialog);
        this._instrumentation.onDialog(dialog);
        let hasHandlers = false;
        for (const handler of this._dialogHandlers) {
            if (handler(dialog))
                hasHandlers = true;
        }
        if (!hasHandlers)
            dialog.close().then(() => { });
    }
    dialogWillClose(dialog) {
        this._openedDialogs.delete(dialog);
    }
    addDialogHandler(handler) {
        this._dialogHandlers.add(handler);
    }
    removeDialogHandler(handler) {
        this._dialogHandlers.delete(handler);
        if (!this._dialogHandlers.size) {
            for (const dialog of this._openedDialogs)
                dialog.close().catch(() => { });
        }
    }
    hasOpenDialogsForPage(page) {
        return [...this._openedDialogs].some(dialog => dialog.page() === page);
    }
    async closeBeforeUnloadDialogs() {
        await Promise.all([...this._openedDialogs].map(async (dialog) => {
            if (dialog.type() === 'beforeunload')
                await dialog.dismiss();
        }));
    }
}
exports.DialogManager = DialogManager;
