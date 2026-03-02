"use strict";
/**
 * Copyright Microsoft Corporation. All rights reserved.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startProfiling = startProfiling;
exports.stopProfiling = stopProfiling;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const profileDir = process.env.PWTEST_PROFILE_DIR || '';
let session;
async function startProfiling() {
    if (!profileDir)
        return;
    session = new (require('inspector').Session)();
    session.connect();
    await new Promise(f => {
        session.post('Profiler.enable', () => {
            session.post('Profiler.start', f);
        });
    });
}
async function stopProfiling(profileName) {
    if (!profileDir)
        return;
    await new Promise(f => session.post('Profiler.stop', (err, { profile }) => {
        if (!err) {
            fs_1.default.mkdirSync(profileDir, { recursive: true });
            fs_1.default.writeFileSync(path_1.default.join(profileDir, profileName + '.json'), JSON.stringify(profile));
        }
        f();
    }));
}
