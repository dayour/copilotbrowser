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
exports.startTraceViewerServer = exports.openTraceViewerApp = exports.openTraceInBrowser = exports.installRootRedirect = exports.createcopilotbrowser = exports.copilotbrowserDispatcher = exports.RootDispatcher = exports.DispatcherConnection = exports.writeDockerVersion = exports.registryDirectory = exports.registry = exports.installBrowsersForNpmInstall = exports.Registry = void 0;
var registry_1 = require("./registry");
Object.defineProperty(exports, "Registry", { enumerable: true, get: function () { return registry_1.Registry; } });
Object.defineProperty(exports, "installBrowsersForNpmInstall", { enumerable: true, get: function () { return registry_1.installBrowsersForNpmInstall; } });
Object.defineProperty(exports, "registry", { enumerable: true, get: function () { return registry_1.registry; } });
Object.defineProperty(exports, "registryDirectory", { enumerable: true, get: function () { return registry_1.registryDirectory; } });
Object.defineProperty(exports, "writeDockerVersion", { enumerable: true, get: function () { return registry_1.writeDockerVersion; } });
var dispatcher_1 = require("./dispatchers/dispatcher");
Object.defineProperty(exports, "DispatcherConnection", { enumerable: true, get: function () { return dispatcher_1.DispatcherConnection; } });
Object.defineProperty(exports, "RootDispatcher", { enumerable: true, get: function () { return dispatcher_1.RootDispatcher; } });
var copilotbrowserDispatcher_1 = require("./dispatchers/copilotbrowserDispatcher");
Object.defineProperty(exports, "copilotbrowserDispatcher", { enumerable: true, get: function () { return copilotbrowserDispatcher_1.copilotbrowserDispatcher; } });
var copilotbrowser_1 = require("./copilotbrowser");
Object.defineProperty(exports, "createcopilotbrowser", { enumerable: true, get: function () { return copilotbrowser_1.createcopilotbrowser; } });
var traceViewer_1 = require("./trace/viewer/traceViewer");
Object.defineProperty(exports, "installRootRedirect", { enumerable: true, get: function () { return traceViewer_1.installRootRedirect; } });
Object.defineProperty(exports, "openTraceInBrowser", { enumerable: true, get: function () { return traceViewer_1.openTraceInBrowser; } });
Object.defineProperty(exports, "openTraceViewerApp", { enumerable: true, get: function () { return traceViewer_1.openTraceViewerApp; } });
Object.defineProperty(exports, "startTraceViewerServer", { enumerable: true, get: function () { return traceViewer_1.startTraceViewerServer; } });
