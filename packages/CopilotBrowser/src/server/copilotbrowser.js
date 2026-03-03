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
exports.copilotbrowser = void 0;
exports.createcopilotbrowser = createcopilotbrowser;
const android_1 = require("./android/android");
const backendAdb_1 = require("./android/backendAdb");
const bidiChromium_1 = require("./bidi/bidiChromium");
const bidiFirefox_1 = require("./bidi/bidiFirefox");
const chromium_1 = require("./chromium/chromium");
const debugController_1 = require("./debugController");
const electron_1 = require("./electron/electron");
const firefox_1 = require("./firefox/firefox");
const instrumentation_1 = require("./instrumentation");
const webkit_1 = require("./webkit/webkit");
class copilotbrowser extends instrumentation_1.SdkObject {
    chromium;
    android;
    electron;
    firefox;
    webkit;
    options;
    debugController;
    _allPages = new Set();
    _allBrowsers = new Set();
    constructor(options) {
        super((0, instrumentation_1.createRootSdkObject)(), undefined, 'copilotbrowser');
        this.options = options;
        this.attribution.copilotbrowser = this;
        this.instrumentation.addListener({
            onBrowserOpen: browser => this._allBrowsers.add(browser),
            onBrowserClose: browser => this._allBrowsers.delete(browser),
            onPageOpen: page => this._allPages.add(page),
            onPageClose: page => this._allPages.delete(page),
        }, null);
        this.chromium = new chromium_1.Chromium(this, new bidiChromium_1.BidiChromium(this));
        this.firefox = new firefox_1.Firefox(this, new bidiFirefox_1.BidiFirefox(this));
        this.webkit = new webkit_1.WebKit(this);
        this.electron = new electron_1.Electron(this);
        this.android = new android_1.Android(this, new backendAdb_1.AdbBackend());
        this.debugController = new debugController_1.DebugController(this);
    }
    allBrowsers() {
        return [...this._allBrowsers];
    }
    allPages() {
        return [...this._allPages];
    }
}
exports.copilotbrowser = copilotbrowser;
function createcopilotbrowser(options) {
    return new copilotbrowser(options);
}
