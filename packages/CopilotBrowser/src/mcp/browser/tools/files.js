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
exports.uploadFile = void 0;
const mcpBundle_1 = require("copilotbrowser-core/lib/mcpBundle");
const tool_1 = require("./tool");
exports.uploadFile = (0, tool_1.defineTabTool)({
    capability: 'core',
    schema: {
        name: 'browser_file_upload',
        title: 'Upload files',
        description: 'Upload one or multiple files',
        inputSchema: mcpBundle_1.z.object({
            paths: mcpBundle_1.z.array(mcpBundle_1.z.string()).optional().describe('The absolute paths to the files to upload. Can be single file or multiple files. If omitted, file chooser is cancelled.'),
        }),
        type: 'action',
    },
    handle: async (tab, params, response) => {
        response.setIncludeSnapshot();
        const modalState = tab.modalStates().find(state => state.type === 'fileChooser');
        if (!modalState)
            throw new Error('No file chooser visible');
        response.addCode(`await fileChooser.setFiles(${JSON.stringify(params.paths)})`);
        tab.clearModalState(modalState);
        await tab.waitForCompletion(async () => {
            if (params.paths)
                await modalState.fileChooser.setFiles(params.paths);
        });
    },
    clearsModalState: 'fileChooser',
});
exports.default = [
    exports.uploadFile,
];
