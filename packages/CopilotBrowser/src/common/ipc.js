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
exports.serializeConfig = serializeConfig;
exports.stdioChunkToParams = stdioChunkToParams;
const util_1 = __importDefault(require("util"));
const compilationCache_1 = require("../transform/compilationCache");
function serializeConfig(config, passCompilationCache) {
    const result = {
        location: { configDir: config.configDir, resolvedConfigFile: config.config.configFile },
        configCLIOverrides: config.configCLIOverrides,
        compilationCache: passCompilationCache ? (0, compilationCache_1.serializeCompilationCache)() : undefined,
    };
    try {
        result.metadata = JSON.stringify(config.config.metadata);
    }
    catch (error) { }
    return result;
}
function stdioChunkToParams(chunk) {
    if (chunk instanceof Uint8Array)
        return { buffer: Buffer.from(chunk).toString('base64') };
    if (typeof chunk !== 'string')
        return { text: util_1.default.inspect(chunk) };
    return { text: chunk };
}
