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
exports.JavaScriptFormatter = exports.JavaScriptLanguageGenerator = void 0;
exports.quoteMultiline = quoteMultiline;
const language_1 = require("./language");
const utils_1 = require("../../utils");
const deviceDescriptors_1 = require("../deviceDescriptors");
class JavaScriptLanguageGenerator {
    id;
    groupName = 'Node.js';
    name;
    highlighter = 'javascript';
    _isTest;
    constructor(isTest) {
        this.id = isTest ? 'copilotbrowser-test' : 'javascript';
        this.name = isTest ? 'Test Runner' : 'Library';
        this._isTest = isTest;
    }
    generateAction(actionInContext) {
        const action = actionInContext.action;
        if (this._isTest && (action.name === 'openPage' || action.name === 'closePage'))
            return '';
        const pageAlias = actionInContext.frame.pageAlias;
        const formatter = new JavaScriptFormatter(2);
        if (action.name === 'openPage') {
            formatter.add(`const ${pageAlias} = await context.newPage();`);
            if (action.url && action.url !== 'about:blank' && action.url !== 'chrome://newtab/')
                formatter.add(`await ${pageAlias}.goto(${quote(action.url)});`);
            return formatter.format();
        }
        const locators = actionInContext.frame.framePath.map(selector => `.${this._asLocator(selector)}.contentFrame()`);
        const subject = `${pageAlias}${locators.join('')}`;
        const signals = (0, language_1.toSignalMap)(action);
        if (signals.dialog) {
            formatter.add(`  ${pageAlias}.once('dialog', dialog => {
    console.log(\`Dialog message: $\{dialog.message()}\`);
    dialog.dismiss().catch(() => {});
  });`);
        }
        if (signals.popup)
            formatter.add(`const ${signals.popup.popupAlias}Promise = ${pageAlias}.waitForEvent('popup');`);
        if (signals.download)
            formatter.add(`const download${signals.download.downloadAlias}Promise = ${pageAlias}.waitForEvent('download');`);
        formatter.add(wrapWithStep(actionInContext.description, this._generateActionCall(subject, actionInContext)));
        if (signals.popup)
            formatter.add(`const ${signals.popup.popupAlias} = await ${signals.popup.popupAlias}Promise;`);
        if (signals.download)
            formatter.add(`const download${signals.download.downloadAlias} = await download${signals.download.downloadAlias}Promise;`);
        return formatter.format();
    }
    _generateActionCall(subject, actionInContext) {
        const action = actionInContext.action;
        switch (action.name) {
            case 'openPage':
                throw Error('Not reached');
            case 'closePage':
                return `await ${subject}.close();`;
            case 'click': {
                let method = 'click';
                if (action.clickCount === 2)
                    method = 'dblclick';
                const options = (0, language_1.toClickOptionsForSourceCode)(action);
                const optionsString = formatOptions(options, false);
                return `await ${subject}.${this._asLocator(action.selector)}.${method}(${optionsString});`;
            }
            case 'hover':
                return `await ${subject}.${this._asLocator(action.selector)}.hover(${formatOptions({ position: action.position }, false)});`;
            case 'check':
                return `await ${subject}.${this._asLocator(action.selector)}.check();`;
            case 'uncheck':
                return `await ${subject}.${this._asLocator(action.selector)}.uncheck();`;
            case 'fill':
                return `await ${subject}.${this._asLocator(action.selector)}.fill(${quote(action.text)});`;
            case 'setInputFiles':
                return `await ${subject}.${this._asLocator(action.selector)}.setInputFiles(${(0, utils_1.formatObject)(action.files.length === 1 ? action.files[0] : action.files)});`;
            case 'press': {
                const modifiers = (0, language_1.toKeyboardModifiers)(action.modifiers);
                const shortcut = [...modifiers, action.key].join('+');
                return `await ${subject}.${this._asLocator(action.selector)}.press(${quote(shortcut)});`;
            }
            case 'navigate':
                return `await ${subject}.goto(${quote(action.url)});`;
            case 'select':
                return `await ${subject}.${this._asLocator(action.selector)}.selectOption(${(0, utils_1.formatObject)(action.options.length === 1 ? action.options[0] : action.options)});`;
            case 'assertText':
                return `${this._isTest ? '' : '// '}await expect(${subject}.${this._asLocator(action.selector)}).${action.substring ? 'toContainText' : 'toHaveText'}(${quote(action.text)});`;
            case 'assertChecked':
                return `${this._isTest ? '' : '// '}await expect(${subject}.${this._asLocator(action.selector)})${action.checked ? '' : '.not'}.toBeChecked();`;
            case 'assertVisible':
                return `${this._isTest ? '' : '// '}await expect(${subject}.${this._asLocator(action.selector)}).toBeVisible();`;
            case 'assertValue': {
                const assertion = action.value ? `toHaveValue(${quote(action.value)})` : `toBeEmpty()`;
                return `${this._isTest ? '' : '// '}await expect(${subject}.${this._asLocator(action.selector)}).${assertion};`;
            }
            case 'assertSnapshot': {
                const commentIfNeeded = this._isTest ? '' : '// ';
                return `${commentIfNeeded}await expect(${subject}.${this._asLocator(action.selector)}).toMatchAriaSnapshot(${quoteMultiline(action.ariaSnapshot, `${commentIfNeeded}  `)});`;
            }
        }
    }
    _asLocator(selector) {
        return (0, utils_1.asLocator)('javascript', selector);
    }
    generateHeader(options) {
        if (this._isTest)
            return this.generateTestHeader(options);
        return this.generateStandaloneHeader(options);
    }
    generateFooter(saveStorage) {
        if (this._isTest)
            return this.generateTestFooter(saveStorage);
        return this.generateStandaloneFooter(saveStorage);
    }
    generateTestHeader(options) {
        const formatter = new JavaScriptFormatter();
        const useText = formatContextOptions(options.contextOptions, options.deviceName, this._isTest);
        formatter.add(`
      import { test, expect${options.deviceName ? ', devices' : ''} } from '@copilotbrowser/test';
${useText ? '\ntest.use(' + useText + ');\n' : ''}
      test('test', async ({ page }) => {`);
        if (options.contextOptions.recordHar) {
            const url = options.contextOptions.recordHar.urlFilter;
            formatter.add(`  await page.routeFromHAR(${quote(options.contextOptions.recordHar.path)}${url ? `, ${formatOptions({ url }, false)}` : ''});`);
        }
        return formatter.format();
    }
    generateTestFooter(saveStorage) {
        return `});`;
    }
    generateStandaloneHeader(options) {
        const formatter = new JavaScriptFormatter();
        formatter.add(`
      const { ${options.browserName}${options.deviceName ? ', devices' : ''} } = require('@copilotbrowser/copilotbrowser');

      (async () => {
        const browser = await ${options.browserName}.launch(${(0, utils_1.formatObjectOrVoid)(options.launchOptions)});
        const context = await browser.newContext(${formatContextOptions(options.contextOptions, options.deviceName, false)});`);
        if (options.contextOptions.recordHar)
            formatter.add(`        await context.routeFromHAR(${quote(options.contextOptions.recordHar.path)});`);
        return formatter.format();
    }
    generateStandaloneFooter(saveStorage) {
        const storageStateLine = saveStorage ? `\n  await context.storageState({ path: ${quote(saveStorage)} });` : '';
        return `\n  // ---------------------${storageStateLine}
  await context.close();
  await browser.close();
})();`;
    }
}
exports.JavaScriptLanguageGenerator = JavaScriptLanguageGenerator;
function formatOptions(value, hasArguments) {
    const keys = Object.keys(value).filter(key => value[key] !== undefined);
    if (!keys.length)
        return '';
    return (hasArguments ? ', ' : '') + (0, utils_1.formatObject)(value);
}
function formatContextOptions(options, deviceName, isTest) {
    const device = deviceName && deviceDescriptors_1.deviceDescriptors[deviceName];
    // recordHAR is replaced with routeFromHAR in the generated code.
    options = { ...options, recordHar: undefined };
    if (!device)
        return (0, utils_1.formatObjectOrVoid)(options);
    // Filter out all the properties from the device descriptor.
    let serializedObject = (0, utils_1.formatObjectOrVoid)((0, language_1.sanitizeDeviceOptions)(device, options));
    // When there are no additional context options, we still want to spread the device inside.
    if (!serializedObject)
        serializedObject = '{\n}';
    const lines = serializedObject.split('\n');
    lines.splice(1, 0, `...devices[${quote(deviceName)}],`);
    return lines.join('\n');
}
class JavaScriptFormatter {
    _baseIndent;
    _baseOffset;
    _lines = [];
    constructor(offset = 0) {
        this._baseIndent = ' '.repeat(2);
        this._baseOffset = ' '.repeat(offset);
    }
    prepend(text) {
        const trim = isMultilineString(text) ? (line) => line : (line) => line.trim();
        this._lines = text.trim().split('\n').map(trim).concat(this._lines);
    }
    add(text) {
        const trim = isMultilineString(text) ? (line) => line : (line) => line.trim();
        this._lines.push(...text.trim().split('\n').map(trim));
    }
    newLine() {
        this._lines.push('');
    }
    format() {
        let spaces = '';
        let previousLine = '';
        return this._lines.map((line) => {
            if (line === '')
                return line;
            if (line.startsWith('}') || line.startsWith(']'))
                spaces = spaces.substring(this._baseIndent.length);
            const extraSpaces = /^(for|while|if|try).*\(.*\)$/.test(previousLine) ? this._baseIndent : '';
            previousLine = line;
            const callCarryOver = line.startsWith('.set');
            line = spaces + extraSpaces + (callCarryOver ? this._baseIndent : '') + line;
            if (line.endsWith('{') || line.endsWith('['))
                spaces += this._baseIndent;
            return this._baseOffset + line;
        }).join('\n');
    }
}
exports.JavaScriptFormatter = JavaScriptFormatter;
function quote(text) {
    return (0, utils_1.escapeWithQuotes)(text, '\'');
}
function wrapWithStep(description, body) {
    return description ? `await test.step(\`${description}\`, async () => {
${body}
});` : body;
}
function quoteMultiline(text, indent = '  ') {
    const escape = (text) => text.replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$\{/g, '\\${');
    const lines = text.split('\n');
    if (lines.length === 1)
        return '`' + escape(text) + '`';
    return '`\n' + lines.map(line => indent + escape(line).replace(/\${/g, '\\${')).join('\n') + `\n${indent}\``;
}
function isMultilineString(text) {
    return text.match(/`[\S\s]*`/)?.[0].includes('\n');
}
