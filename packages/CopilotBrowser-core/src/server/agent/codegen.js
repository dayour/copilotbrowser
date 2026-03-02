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
exports.generateCode = generateCode;
const locatorGenerators_1 = require("../../utils/isomorphic/locatorGenerators");
const stringUtils_1 = require("../../utils/isomorphic/stringUtils");
async function generateCode(sdkLanguage, action) {
    switch (action.method) {
        case 'navigate': {
            return `await page.goto(${(0, stringUtils_1.escapeWithQuotes)(action.url)});`;
        }
        case 'click': {
            const locator = (0, locatorGenerators_1.asLocator)(sdkLanguage, action.selector);
            return `await page.${locator}.click(${(0, stringUtils_1.formatObjectOrVoid)({
                button: action.button,
                clickCount: action.clickCount,
                modifiers: action.modifiers,
            })});`;
        }
        case 'drag': {
            const sourceLocator = (0, locatorGenerators_1.asLocator)(sdkLanguage, action.sourceSelector);
            const targetLocator = (0, locatorGenerators_1.asLocator)(sdkLanguage, action.targetSelector);
            return `await page.${sourceLocator}.dragAndDrop(${targetLocator});`;
        }
        case 'hover': {
            const locator = (0, locatorGenerators_1.asLocator)(sdkLanguage, action.selector);
            return `await page.${locator}.hover(${(0, stringUtils_1.formatObjectOrVoid)({
                modifiers: action.modifiers,
            })});`;
        }
        case 'pressKey': {
            return `await page.keyboard.press(${(0, stringUtils_1.escapeWithQuotes)(action.key, '\'')});`;
        }
        case 'selectOption': {
            const locator = (0, locatorGenerators_1.asLocator)(sdkLanguage, action.selector);
            return `await page.${locator}.selectOption(${action.labels.length === 1 ? (0, stringUtils_1.escapeWithQuotes)(action.labels[0]) : '[' + action.labels.map(label => (0, stringUtils_1.escapeWithQuotes)(label)).join(', ') + ']'});`;
        }
        case 'pressSequentially': {
            const locator = (0, locatorGenerators_1.asLocator)(sdkLanguage, action.selector);
            const code = [`await page.${locator}.pressSequentially(${(0, stringUtils_1.escapeWithQuotes)(action.text)});`];
            if (action.submit)
                code.push(`await page.keyboard.press('Enter');`);
            return code.join('\n');
        }
        case 'fill': {
            const locator = (0, locatorGenerators_1.asLocator)(sdkLanguage, action.selector);
            const code = [`await page.${locator}.fill(${(0, stringUtils_1.escapeWithQuotes)(action.text)});`];
            if (action.submit)
                code.push(`await page.keyboard.press('Enter');`);
            return code.join('\n');
        }
        case 'setChecked': {
            const locator = (0, locatorGenerators_1.asLocator)(sdkLanguage, action.selector);
            if (action.checked)
                return `await page.${locator}.check();`;
            else
                return `await page.${locator}.uncheck();`;
        }
        case 'expectVisible': {
            const locator = (0, locatorGenerators_1.asLocator)(sdkLanguage, action.selector);
            const notInfix = action.isNot ? 'not.' : '';
            return `await expect(page.${locator}).${notInfix}toBeVisible();`;
        }
        case 'expectValue': {
            const notInfix = action.isNot ? 'not.' : '';
            const locator = (0, locatorGenerators_1.asLocator)(sdkLanguage, action.selector);
            if (action.type === 'checkbox' || action.type === 'radio')
                return `await expect(page.${locator}).${notInfix}toBeChecked({ checked: ${action.value === 'true'} });`;
            return `await expect(page.${locator}).${notInfix}toHaveValue(${(0, stringUtils_1.escapeWithQuotes)(action.value)});`;
        }
        case 'expectAria': {
            const notInfix = action.isNot ? 'not.' : '';
            return `await expect(page.locator('body')).${notInfix}toMatchAria(\`\n${(0, stringUtils_1.escapeTemplateString)(action.template)}\n\`);`;
        }
        case 'expectURL': {
            const arg = action.regex ? (0, stringUtils_1.parseRegex)(action.regex).toString() : (0, stringUtils_1.escapeWithQuotes)(action.value);
            const notInfix = action.isNot ? 'not.' : '';
            return `await expect(page).${notInfix}toHaveURL(${arg});`;
        }
        case 'expectTitle': {
            const notInfix = action.isNot ? 'not.' : '';
            return `await expect(page).${notInfix}toHaveTitle(${(0, stringUtils_1.escapeWithQuotes)(action.value)});`;
        }
    }
    // @ts-expect-error
    throw new Error('Unknown action ' + action.method);
}
