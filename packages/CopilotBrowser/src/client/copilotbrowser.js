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
const android_1 = require("./android");
const browser_1 = require("./browser");
const browserType_1 = require("./browserType");
const channelOwner_1 = require("./channelOwner");
const electron_1 = require("./electron");
const errors_1 = require("./errors");
const fetch_1 = require("./fetch");
const selectors_1 = require("./selectors");
class copilotbrowser extends channelOwner_1.ChannelOwner {
    _android;
    _electron;
    chromium;
    firefox;
    webkit;
    devices;
    selectors;
    request;
    errors;
    // Instrumentation.
    _defaultLaunchOptions;
    _defaultContextTimeout;
    _defaultContextNavigationTimeout;
    constructor(parent, type, guid, initializer) {
        super(parent, type, guid, initializer);
        this.request = new fetch_1.APIRequest(this);
        this.chromium = browserType_1.BrowserType.from(initializer.chromium);
        this.chromium._copilotbrowser = this;
        this.firefox = browserType_1.BrowserType.from(initializer.firefox);
        this.firefox._copilotbrowser = this;
        this.webkit = browserType_1.BrowserType.from(initializer.webkit);
        this.webkit._copilotbrowser = this;
        this._android = android_1.Android.from(initializer.android);
        this._android._copilotbrowser = this;
        this._electron = electron_1.Electron.from(initializer.electron);
        this._electron._copilotbrowser = this;
        this.devices = this._connection.localUtils()?.devices ?? {};
        this.selectors = new selectors_1.Selectors(this._connection._platform);
        this.errors = { TimeoutError: errors_1.TimeoutError };
    }
    static from(channel) {
        return channel._object;
    }
    _browserTypes() {
        return [this.chromium, this.firefox, this.webkit];
    }
    _preLaunchedBrowser() {
        const browser = browser_1.Browser.from(this._initializer.preLaunchedBrowser);
        browser._connectToBrowserType(this[browser._name], {}, undefined);
        return browser;
    }
    _allContexts() {
        return this._browserTypes().flatMap(type => [...type._contexts]);
    }
    _allPages() {
        return this._allContexts().flatMap(context => context.pages());
    }
}
exports.copilotbrowser = copilotbrowser;
