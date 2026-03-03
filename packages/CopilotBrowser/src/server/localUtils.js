"use strict";
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License");
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.zip = zip;
exports.harOpen = harOpen;
exports.harLookup = harLookup;
exports.harClose = harClose;
exports.harUnzip = harUnzip;
exports.tracingStarted = tracingStarted;
exports.traceDiscarded = traceDiscarded;
exports.addStackToTracingNoReply = addStackToTracingNoReply;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const crypto_1 = require("./utils/crypto");
const harBackend_1 = require("./harBackend");
const manualPromise_1 = require("../utils/isomorphic/manualPromise");
const zipFile_1 = require("./utils/zipFile");
const zipBundle_1 = require("../zipBundle");
const traceUtils_1 = require("../utils/isomorphic/traceUtils");
const assert_1 = require("../utils/isomorphic/assert");
const fileUtils_1 = require("./utils/fileUtils");
async function zip(progress, stackSessions, params) {
    const promise = new manualPromise_1.ManualPromise();
    const zipFile = new zipBundle_1.yazl.ZipFile();
    zipFile.on('error', error => promise.reject(error));
    const addFile = (file, name) => {
        try {
            if (fs_1.default.statSync(file).isFile())
                zipFile.addFile(file, name);
        }
        catch (e) {
        }
    };
    for (const entry of params.entries)
        addFile(entry.value, entry.name);
    // Add stacks and the sources.
    const stackSession = params.stacksId ? stackSessions.get(params.stacksId) : undefined;
    if (stackSession?.callStacks.length) {
        await progress.race(stackSession.writer);
        const buffer = Buffer.from(JSON.stringify((0, traceUtils_1.serializeClientSideCallMetadata)(stackSession.callStacks)));
        zipFile.addBuffer(buffer, 'trace.stacks');
    }
    // Collect sources from stacks.
    if (params.includeSources) {
        const sourceFiles = new Set();
        for (const { stack } of stackSession?.callStacks || []) {
            if (!stack)
                continue;
            for (const { file } of stack)
                sourceFiles.add(file);
        }
        for (const sourceFile of sourceFiles)
            addFile(sourceFile, 'resources/src@' + await (0, crypto_1.calculateSha1)(sourceFile) + '.txt');
    }
    if (params.mode === 'write') {
        // New file, just compress the entries.
        await progress.race(fs_1.default.promises.mkdir(path_1.default.dirname(params.zipFile), { recursive: true }));
        zipFile.end(undefined, () => {
            zipFile.outputStream.pipe(fs_1.default.createWriteStream(params.zipFile))
                .on('close', () => promise.resolve())
                .on('error', error => promise.reject(error));
        });
        await progress.race(promise);
        await deleteStackSession(progress, stackSessions, params.stacksId);
        return;
    }
    // File already exists. Repack and add new entries.
    const tempFile = params.zipFile + '.tmp';
    await progress.race(fs_1.default.promises.rename(params.zipFile, tempFile));
    zipBundle_1.yauzl.open(tempFile, (err, inZipFile) => {
        if (err) {
            promise.reject(err);
            return;
        }
        (0, assert_1.assert)(inZipFile);
        let pendingEntries = inZipFile.entryCount;
        inZipFile.on('entry', entry => {
            inZipFile.openReadStream(entry, (err, readStream) => {
                if (err) {
                    promise.reject(err);
                    return;
                }
                zipFile.addReadStream(readStream, entry.fileName);
                if (--pendingEntries === 0) {
                    zipFile.end(undefined, () => {
                        zipFile.outputStream.pipe(fs_1.default.createWriteStream(params.zipFile)).on('close', () => {
                            fs_1.default.promises.unlink(tempFile).then(() => {
                                promise.resolve();
                            }).catch(error => promise.reject(error));
                        });
                    });
                }
            });
        });
    });
    await progress.race(promise);
    await deleteStackSession(progress, stackSessions, params.stacksId);
}
async function deleteStackSession(progress, stackSessions, stacksId) {
    const session = stacksId ? stackSessions.get(stacksId) : undefined;
    if (!session)
        return;
    stackSessions.delete(stacksId);
    if (session.tmpDir)
        await progress.race((0, fileUtils_1.removeFolders)([session.tmpDir]));
}
async function harOpen(progress, harBackends, params) {
    let harBackend;
    if (params.file.endsWith('.zip')) {
        const zipFile = new zipFile_1.ZipFile(params.file);
        try {
            const entryNames = await progress.race(zipFile.entries());
            const harEntryName = entryNames.find(e => e.endsWith('.har'));
            if (!harEntryName)
                return { error: 'Specified archive does not have a .har file' };
            const har = await progress.race(zipFile.read(harEntryName));
            const harFile = JSON.parse(har.toString());
            harBackend = new harBackend_1.HarBackend(harFile, null, zipFile);
        }
        catch (error) {
            zipFile.close();
            throw error;
        }
    }
    else {
        const harFile = JSON.parse(await progress.race(fs_1.default.promises.readFile(params.file, 'utf-8')));
        harBackend = new harBackend_1.HarBackend(harFile, path_1.default.dirname(params.file), null);
    }
    harBackends.set(harBackend.id, harBackend);
    return { harId: harBackend.id };
}
async function harLookup(progress, harBackends, params) {
    const harBackend = harBackends.get(params.harId);
    if (!harBackend)
        return { action: 'error', message: `Internal error: har was not opened` };
    return await progress.race(harBackend.lookup(params.url, params.method, params.headers, params.postData, params.isNavigationRequest));
}
function harClose(harBackends, params) {
    const harBackend = harBackends.get(params.harId);
    if (harBackend) {
        harBackends.delete(harBackend.id);
        harBackend.dispose();
    }
}
async function harUnzip(progress, params) {
    const dir = path_1.default.dirname(params.zipFile);
    const zipFile = new zipFile_1.ZipFile(params.zipFile);
    try {
        for (const entry of await progress.race(zipFile.entries())) {
            const buffer = await progress.race(zipFile.read(entry));
            if (entry === 'har.har')
                await progress.race(fs_1.default.promises.writeFile(params.harFile, buffer));
            else
                await progress.race(fs_1.default.promises.writeFile(path_1.default.join(dir, entry), buffer));
        }
        await progress.race(fs_1.default.promises.unlink(params.zipFile));
    }
    finally {
        zipFile.close();
    }
}
async function tracingStarted(progress, stackSessions, params) {
    let tmpDir = undefined;
    if (!params.tracesDir)
        tmpDir = await progress.race(fs_1.default.promises.mkdtemp(path_1.default.join(os_1.default.tmpdir(), 'copilotbrowser-tracing-')));
    const traceStacksFile = path_1.default.join(params.tracesDir || tmpDir, params.traceName + '.stacks');
    stackSessions.set(traceStacksFile, { callStacks: [], file: traceStacksFile, writer: Promise.resolve(), tmpDir, live: params.live });
    return { stacksId: traceStacksFile };
}
async function traceDiscarded(progress, stackSessions, params) {
    await deleteStackSession(progress, stackSessions, params.stacksId);
}
function addStackToTracingNoReply(stackSessions, params) {
    for (const session of stackSessions.values()) {
        session.callStacks.push(params.callData);
        if (session.live) {
            session.writer = session.writer.then(() => {
                const buffer = Buffer.from(JSON.stringify((0, traceUtils_1.serializeClientSideCallMetadata)(session.callStacks)));
                return fs_1.default.promises.writeFile(session.file, buffer);
            });
        }
    }
}
