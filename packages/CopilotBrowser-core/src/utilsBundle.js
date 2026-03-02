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
exports.yaml = exports.wsSender = exports.wsReceiver = exports.wsServer = exports.ws = exports.SocksProxyAgent = exports.progress = exports.ProgramOption = exports.program = exports.PNG = exports.open = exports.minimatch = exports.mime = exports.lockfile = exports.jpegjs = exports.HttpsProxyAgent = exports.getProxyForUrl = exports.ini = exports.dotenv = exports.diff = exports.debug = exports.colors = void 0;
exports.ms = ms;
exports.colors = require('./utilsBundleImpl').colors;
exports.debug = require('./utilsBundleImpl').debug;
exports.diff = require('./utilsBundleImpl').diff;
exports.dotenv = require('./utilsBundleImpl').dotenv;
exports.ini = require('./utilsBundleImpl').ini;
exports.getProxyForUrl = require('./utilsBundleImpl').getProxyForUrl;
exports.HttpsProxyAgent = require('./utilsBundleImpl').HttpsProxyAgent;
exports.jpegjs = require('./utilsBundleImpl').jpegjs;
exports.lockfile = require('./utilsBundleImpl').lockfile;
exports.mime = require('./utilsBundleImpl').mime;
exports.minimatch = require('./utilsBundleImpl').minimatch;
exports.open = require('./utilsBundleImpl').open;
exports.PNG = require('./utilsBundleImpl').PNG;
exports.program = require('./utilsBundleImpl').program;
exports.ProgramOption = require('./utilsBundleImpl').ProgramOption;
exports.progress = require('./utilsBundleImpl').progress;
exports.SocksProxyAgent = require('./utilsBundleImpl').SocksProxyAgent;
exports.ws = require('./utilsBundleImpl').ws;
exports.wsServer = require('./utilsBundleImpl').wsServer;
exports.wsReceiver = require('./utilsBundleImpl').wsReceiver;
exports.wsSender = require('./utilsBundleImpl').wsSender;
exports.yaml = require('./utilsBundleImpl').yaml;
function ms(ms) {
    if (!isFinite(ms))
        return '-';
    if (ms === 0)
        return '0ms';
    if (ms < 1000)
        return ms.toFixed(0) + 'ms';
    const seconds = ms / 1000;
    if (seconds < 60)
        return seconds.toFixed(1) + 's';
    const minutes = seconds / 60;
    if (minutes < 60)
        return minutes.toFixed(1) + 'm';
    const hours = minutes / 60;
    if (hours < 24)
        return hours.toFixed(1) + 'h';
    const days = hours / 24;
    return days.toFixed(1) + 'd';
}
