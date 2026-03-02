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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadBrowserWithProgressBar = downloadBrowserWithProgressBar;
exports.logPolitely = logPolitely;
const childProcess = __importStar(require("child_process"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const debugLogger_1 = require("../utils/debugLogger");
const manualPromise_1 = require("../../utils/isomorphic/manualPromise");
const userAgent_1 = require("../utils/userAgent");
const utilsBundle_1 = require("../../utilsBundle");
const fileUtils_1 = require("../utils/fileUtils");
const _1 = require(".");
async function downloadBrowserWithProgressBar(title, browserDirectory, executablePath, downloadURLs, downloadFileName, downloadSocketTimeout, force) {
    if (await (0, fileUtils_1.existsAsync)((0, _1.browserDirectoryToMarkerFilePath)(browserDirectory))) {
        // Already downloaded.
        debugLogger_1.debugLogger.log('install', `${title} is already downloaded.`);
        if (force)
            debugLogger_1.debugLogger.log('install', `force-downloading ${title}.`);
        else
            return;
    }
    // Create a unique temporary directory for this download to prevent concurrent downloads from clobbering each other
    const uniqueTempDir = await fs_1.default.promises.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'copilotbrowser-download-'));
    const zipPath = path_1.default.join(uniqueTempDir, downloadFileName);
    try {
        const retryCount = 5;
        for (let attempt = 1; attempt <= retryCount; ++attempt) {
            debugLogger_1.debugLogger.log('install', `downloading ${title} - attempt #${attempt}`);
            const url = downloadURLs[(attempt - 1) % downloadURLs.length];
            logPolitely(`Downloading ${title}` + utilsBundle_1.colors.dim(` from ${url}`));
            const { error } = await downloadBrowserWithProgressBarOutOfProcess(title, browserDirectory, url, zipPath, executablePath, downloadSocketTimeout);
            if (!error) {
                debugLogger_1.debugLogger.log('install', `SUCCESS installing ${title}`);
                break;
            }
            if (await (0, fileUtils_1.existsAsync)(zipPath))
                await fs_1.default.promises.unlink(zipPath);
            if (await (0, fileUtils_1.existsAsync)(browserDirectory))
                await (0, fileUtils_1.removeFolders)([browserDirectory]);
            const errorMessage = error?.message || '';
            debugLogger_1.debugLogger.log('install', `attempt #${attempt} - ERROR: ${errorMessage}`);
            if (attempt >= retryCount)
                throw error;
        }
    }
    catch (e) {
        debugLogger_1.debugLogger.log('install', `FAILED installation ${title} with error: ${e}`);
        process.exitCode = 1;
        throw e;
    }
    finally {
        // Clean up the temporary directory and its contents
        await (0, fileUtils_1.removeFolders)([uniqueTempDir]);
    }
    logPolitely(`${title} downloaded to ${browserDirectory}`);
}
/**
 * Node.js has a bug where the process can exit with 0 code even though there was an uncaught exception.
 * Thats why we execute it in a separate process and check manually if the destination file exists.
 * https://github.com/dayour/copilotbrowser/issues/17394
 */
function downloadBrowserWithProgressBarOutOfProcess(title, browserDirectory, url, zipPath, executablePath, socketTimeout) {
    const cp = childProcess.fork(path_1.default.join(__dirname, 'oopDownloadBrowserMain.js'));
    const promise = new manualPromise_1.ManualPromise();
    const progress = getDownloadProgress();
    cp.on('message', (message) => {
        if (message?.method === 'log')
            debugLogger_1.debugLogger.log('install', message.params.message);
        if (message?.method === 'progress')
            progress(message.params.done, message.params.total);
    });
    cp.on('exit', code => {
        if (code !== 0) {
            promise.resolve({ error: new Error(`Download failure, code=${code}`) });
            return;
        }
        if (!fs_1.default.existsSync((0, _1.browserDirectoryToMarkerFilePath)(browserDirectory)))
            promise.resolve({ error: new Error(`Download failure, ${(0, _1.browserDirectoryToMarkerFilePath)(browserDirectory)} does not exist`) });
        else
            promise.resolve({ error: null });
    });
    cp.on('error', error => {
        promise.resolve({ error });
    });
    debugLogger_1.debugLogger.log('install', `running download:`);
    debugLogger_1.debugLogger.log('install', `-- from url: ${url}`);
    debugLogger_1.debugLogger.log('install', `-- to location: ${zipPath}`);
    const downloadParams = {
        title,
        browserDirectory,
        url,
        zipPath,
        executablePath,
        socketTimeout,
        userAgent: (0, userAgent_1.getUserAgent)(),
    };
    cp.send({ method: 'download', params: downloadParams });
    return promise;
}
function logPolitely(toBeLogged) {
    const logLevel = process.env.npm_config_loglevel;
    const logLevelDisplay = ['silent', 'error', 'warn'].indexOf(logLevel || '') > -1;
    if (!logLevelDisplay)
        console.log(toBeLogged); // eslint-disable-line no-console
}
function getDownloadProgress() {
    // eslint-disable-next-line no-restricted-properties
    if (process.stdout.isTTY)
        return getAnimatedDownloadProgress();
    return getBasicDownloadProgress();
}
function getAnimatedDownloadProgress() {
    let progressBar;
    let lastDownloadedBytes = 0;
    return (downloadedBytes, totalBytes) => {
        if (!progressBar) {
            progressBar = new utilsBundle_1.progress(`${toMegabytes(totalBytes)} [:bar] :percent :etas`, {
                complete: '=',
                incomplete: ' ',
                width: 20,
                total: totalBytes,
            });
        }
        const delta = downloadedBytes - lastDownloadedBytes;
        lastDownloadedBytes = downloadedBytes;
        progressBar.tick(delta);
    };
}
function getBasicDownloadProgress() {
    const totalRows = 10;
    const stepWidth = 8;
    let lastRow = -1;
    return (downloadedBytes, totalBytes) => {
        const percentage = downloadedBytes / totalBytes;
        const row = Math.floor(totalRows * percentage);
        if (row > lastRow) {
            lastRow = row;
            const percentageString = String(percentage * 100 | 0).padStart(3);
            // eslint-disable-next-line no-console
            console.log(`|${'■'.repeat(row * stepWidth)}${' '.repeat((totalRows - row) * stepWidth)}| ${percentageString}% of ${toMegabytes(totalBytes)}`);
        }
    };
}
function toMegabytes(bytes) {
    const mb = bytes / 1024 / 1024;
    return `${Math.round(mb * 10) / 10} MiB`;
}
