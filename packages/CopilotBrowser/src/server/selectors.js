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
exports.Selectors = void 0;
const crypto_1 = require("./utils/crypto");
const selectorParser_1 = require("../utils/isomorphic/selectorParser");
class Selectors {
    _builtinEngines;
    _builtinEnginesInMainWorld;
    _engines;
    guid = `selectors@${(0, crypto_1.createGuid)()}`;
    _testIdAttributeName;
    constructor(engines, testIdAttributeName) {
        // Note: keep in sync with InjectedScript class.
        this._builtinEngines = new Set([
            'css', 'css:light',
            'xpath', 'xpath:light',
            '_react', '_vue',
            'text', 'text:light',
            'id', 'id:light',
            'data-testid', 'data-testid:light',
            'data-test-id', 'data-test-id:light',
            'data-test', 'data-test:light',
            'nth', 'visible', 'internal:control',
            'internal:has', 'internal:has-not',
            'internal:has-text', 'internal:has-not-text',
            'internal:and', 'internal:or', 'internal:chain',
            'role', 'internal:attr', 'internal:label', 'internal:text',
            'internal:role', 'internal:testid', 'internal:describe',
            'aria-ref'
        ]);
        this._builtinEnginesInMainWorld = new Set([
            '_react', '_vue',
        ]);
        this._engines = new Map();
        this._testIdAttributeName = testIdAttributeName ?? 'data-testid';
        for (const engine of engines)
            this.register(engine);
    }
    register(engine) {
        if (!engine.name.match(/^[a-zA-Z_0-9-]+$/))
            throw new Error('Selector engine name may only contain [a-zA-Z0-9_] characters');
        // Note: we keep 'zs' for future use.
        if (this._builtinEngines.has(engine.name) || engine.name === 'zs' || engine.name === 'zs:light')
            throw new Error(`"${engine.name}" is a predefined selector engine`);
        if (this._engines.has(engine.name))
            throw new Error(`"${engine.name}" selector engine has been already registered`);
        this._engines.set(engine.name, engine);
    }
    testIdAttributeName() {
        return this._testIdAttributeName;
    }
    setTestIdAttributeName(testIdAttributeName) {
        this._testIdAttributeName = testIdAttributeName;
    }
    parseSelector(selector, strict) {
        const parsed = typeof selector === 'string' ? (0, selectorParser_1.parseSelector)(selector) : selector;
        let needsMainWorld = false;
        (0, selectorParser_1.visitAllSelectorParts)(parsed, part => {
            const name = part.name;
            const custom = this._engines.get(name);
            if (!custom && !this._builtinEngines.has(name))
                throw new selectorParser_1.InvalidSelectorError(`Unknown engine "${name}" while parsing selector ${(0, selectorParser_1.stringifySelector)(parsed)}`);
            if (custom && !custom.contentScript)
                needsMainWorld = true;
            if (this._builtinEnginesInMainWorld.has(name))
                needsMainWorld = true;
        });
        return {
            parsed,
            world: needsMainWorld ? 'main' : 'utility',
            strict,
        };
    }
}
exports.Selectors = Selectors;
