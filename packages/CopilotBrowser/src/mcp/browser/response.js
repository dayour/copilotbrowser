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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Response = exports.requestDebug = void 0;
exports.renderTabMarkdown = renderTabMarkdown;
exports.renderTabsMarkdown = renderTabsMarkdown;
exports.parseResponse = parseResponse;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const utilsBundle_1 = require("@copilotbrowser/copilotbrowser/lib/utilsBundle");
const tab_1 = require("./tab");
const screenshot_1 = require("./tools/screenshot");
exports.requestDebug = (0, utilsBundle_1.debug)('pw:mcp:request');
class Response {
    _results = [];
    _errors = [];
    _code = [];
    _context;
    _includeSnapshot = 'none';
    _includeSnapshotFileName;
    _snapshotMaxLength;
    toolName;
    toolArgs;
    _clientWorkspace;
    _imageResults = [];
    constructor(context, toolName, toolArgs, relativeTo) {
        this._context = context;
        this.toolName = toolName;
        this.toolArgs = toolArgs;
        this._clientWorkspace = relativeTo ?? context.firstRootPath();
    }
    _computRelativeTo(fileName) {
        if (this._clientWorkspace)
            return path_1.default.relative(this._clientWorkspace, fileName);
        return fileName;
    }
    async resolveClientFile(template, title) {
        let fileName;
        if (template.suggestedFilename)
            fileName = await this._context.workspaceFile(template.suggestedFilename, this._clientWorkspace);
        else
            fileName = await this._context.outputFile(template, { origin: 'llm' });
        const relativeName = this._computRelativeTo(fileName);
        const printableLink = `- [${title}](${relativeName})`;
        return { fileName, relativeName, printableLink };
    }
    addTextResult(text) {
        this._results.push(text);
    }
    async addResult(title, data, file) {
        if (this._context.config.outputMode === 'file' || file.suggestedFilename || typeof data !== 'string') {
            const resolvedFile = await this.resolveClientFile(file, title);
            await this.addFileResult(resolvedFile, data);
        }
        else {
            this.addTextResult(data);
        }
    }
    async addFileResult(resolvedFile, data) {
        if (typeof data === 'string')
            await fs_1.default.promises.writeFile(resolvedFile.fileName, data, 'utf-8');
        else if (data)
            await fs_1.default.promises.writeFile(resolvedFile.fileName, data);
        this.addTextResult(resolvedFile.printableLink);
    }
    addFileLink(title, fileName) {
        const relativeName = this._computRelativeTo(fileName);
        this.addTextResult(`- [${title}](${relativeName})`);
    }
    async registerImageResult(data, imageType) {
        this._imageResults.push({ data, imageType });
    }
    addError(error) {
        this._errors.push(error);
    }
    addCode(code) {
        this._code.push(code);
    }
    setIncludeSnapshot() {
        this._includeSnapshot = this._context.config.snapshot.mode;
    }
    setIncludeFullSnapshot(includeSnapshotFileName) {
        this._includeSnapshot = 'full';
        this._includeSnapshotFileName = includeSnapshotFileName;
    }
    setSnapshotMaxLength(maxLength) {
        this._snapshotMaxLength = maxLength;
    }
    async serialize() {
        const redactText = (text) => {
            for (const [secretName, secretValue] of Object.entries(this._context.config.secrets ?? {}))
                text = text.replaceAll(secretValue, `<secret>${secretName}</secret>`);
            return text;
        };
        const sections = await this._build();
        const text = [];
        for (const section of sections) {
            if (!section.content.length)
                continue;
            text.push(`### ${section.title}`);
            if (section.codeframe)
                text.push(`\`\`\`${section.codeframe}`);
            text.push(...section.content);
            if (section.codeframe)
                text.push('```');
        }
        const content = [
            {
                type: 'text',
                text: redactText(text.join('\n')),
            }
        ];
        // Image attachments.
        if (this._context.config.imageResponses !== 'omit') {
            for (const imageResult of this._imageResults) {
                const scaledData = (0, screenshot_1.scaleImageToFitMessage)(imageResult.data, imageResult.imageType);
                content.push({ type: 'image', data: scaledData.toString('base64'), mimeType: imageResult.imageType === 'png' ? 'image/png' : 'image/jpeg' });
            }
        }
        return {
            content,
            ...(sections.some(section => section.isError) ? { isError: true } : {}),
        };
    }
    async _build() {
        const sections = [];
        const addSection = (title, content, codeframe) => {
            const section = { title, content, isError: title === 'Error', codeframe };
            sections.push(section);
            return content;
        };
        if (this._errors.length)
            addSection('Error', this._errors);
        if (this._results.length)
            addSection('Result', this._results);
        // Code
        if (this._context.config.codegen !== 'none' && this._code.length)
            addSection('Ran copilotbrowser code', this._code, 'js');
        // Render tab titles upon changes or when more than one tab.
        const tabSnapshot = this._context.currentTab() ? await this._context.currentTabOrDie().captureSnapshot(this._clientWorkspace) : undefined;
        const tabHeaders = await Promise.all(this._context.tabs().map(tab => tab.headerSnapshot()));
        if (this._includeSnapshot !== 'none' || tabHeaders.some(header => header.changed)) {
            if (tabHeaders.length !== 1)
                addSection('Open tabs', renderTabsMarkdown(tabHeaders));
            addSection('Page', renderTabMarkdown(tabHeaders[0]));
        }
        // Handle modal states.
        if (tabSnapshot?.modalStates.length)
            addSection('Modal state', (0, tab_1.renderModalStates)(this._context.config, tabSnapshot.modalStates));
        // Handle tab snapshot
        if (tabSnapshot && this._includeSnapshot !== 'none') {
            const snapshot = this._includeSnapshot === 'full' ? tabSnapshot.ariaSnapshot : tabSnapshot.ariaSnapshotDiff ?? tabSnapshot.ariaSnapshot;
            if (this._context.config.outputMode === 'file' || this._includeSnapshotFileName) {
                const resolvedFile = await this.resolveClientFile({ prefix: 'page', ext: 'yml', suggestedFilename: this._includeSnapshotFileName }, 'Snapshot');
                await fs_1.default.promises.writeFile(resolvedFile.fileName, snapshot, 'utf-8');
                addSection('Snapshot', [resolvedFile.printableLink]);
            }
            else {
                let snapshotText = snapshot;
                if (this._snapshotMaxLength !== undefined && snapshotText.length > this._snapshotMaxLength)
                    snapshotText = snapshotText.slice(0, this._snapshotMaxLength) + '\n... [truncated, full snapshot available via browser_snapshot with no maxLength]';
                addSection('Snapshot', [snapshotText], 'yaml');
            }
        }
        // Handle tab log
        const text = [];
        if (tabSnapshot?.consoleLink)
            text.push(`- New console entries: ${tabSnapshot.consoleLink}`);
        if (tabSnapshot?.events.filter(event => event.type !== 'request').length) {
            for (const event of tabSnapshot.events) {
                if (event.type === 'console' && this._context.config.outputMode !== 'file') {
                    if ((0, tab_1.shouldIncludeMessage)(this._context.config.console.level, event.message.type))
                        text.push(`- ${trimMiddle(event.message.toString(), 100)}`);
                }
                else if (event.type === 'download-start') {
                    text.push(`- Downloading file ${event.download.download.suggestedFilename()} ...`);
                }
                else if (event.type === 'download-finish') {
                    text.push(`- Downloaded file ${event.download.download.suggestedFilename()} to "${this._computRelativeTo(event.download.outputFile)}"`);
                }
            }
        }
        if (text.length)
            addSection('Events', text);
        return sections;
    }
}
exports.Response = Response;
function renderTabMarkdown(tab) {
    const lines = [`- Page URL: ${tab.url}`];
    if (tab.title)
        lines.push(`- Page Title: ${tab.title}`);
    if (tab.console.errors || tab.console.warnings)
        lines.push(`- Console: ${tab.console.errors} errors, ${tab.console.warnings} warnings`);
    return lines;
}
function renderTabsMarkdown(tabs) {
    if (!tabs.length)
        return ['No open tabs. Navigate to a URL to create one.'];
    const lines = [];
    for (let i = 0; i < tabs.length; i++) {
        const tab = tabs[i];
        const current = tab.current ? ' (current)' : '';
        lines.push(`- ${i}:${current} [${tab.title}](${tab.url})`);
    }
    return lines;
}
function trimMiddle(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.slice(0, Math.floor(maxLength / 2)) + '...' + text.slice(-3 - Math.floor(maxLength / 2));
}
function parseSections(text) {
    const sections = new Map();
    const sectionHeaders = text.split(/^### /m).slice(1); // Remove empty first element
    for (const section of sectionHeaders) {
        const firstNewlineIndex = section.indexOf('\n');
        if (firstNewlineIndex === -1)
            continue;
        const sectionName = section.substring(0, firstNewlineIndex);
        const sectionContent = section.substring(firstNewlineIndex + 1).trim();
        sections.set(sectionName, sectionContent);
    }
    return sections;
}
function parseResponse(response) {
    if (response.content?.[0].type !== 'text')
        return undefined;
    const text = response.content[0].text;
    const sections = parseSections(text);
    const error = sections.get('Error');
    const result = sections.get('Result');
    const code = sections.get('Ran copilotbrowser code');
    const tabs = sections.get('Open tabs');
    const page = sections.get('Page');
    const snapshot = sections.get('Snapshot');
    const events = sections.get('Events');
    const modalState = sections.get('Modal state');
    const codeNoFrame = code?.replace(/^```js\n/, '').replace(/\n```$/, '');
    const isError = response.isError;
    const attachments = response.content.length > 1 ? response.content.slice(1) : undefined;
    return {
        result,
        error,
        code: codeNoFrame,
        tabs,
        page,
        snapshot,
        events,
        modalState,
        isError,
        attachments,
        text,
    };
}
