"use strict";
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BidiExecutionContext = void 0;
exports.createHandle = createHandle;
const utils_1 = require("../../utils");
const utilityScriptSerializers_1 = require("../../utils/isomorphic/utilityScriptSerializers");
const js = __importStar(require("../javascript"));
const dom = __importStar(require("../dom"));
const bidiSerializer_1 = require("./third_party/bidiSerializer");
const bidiDeserializer_1 = require("./bidiDeserializer");
class BidiExecutionContext {
    _session;
    _target;
    constructor(session, realmInfo) {
        this._session = session;
        if (realmInfo.type === 'window') {
            // Simple realm does not seem to work for Window contexts.
            this._target = {
                context: realmInfo.context,
                sandbox: realmInfo.sandbox,
            };
        }
        else {
            this._target = {
                realm: realmInfo.realm
            };
        }
    }
    async rawEvaluateJSON(expression) {
        const response = await this._session.send('script.evaluate', {
            expression,
            target: this._target,
            serializationOptions: {
                maxObjectDepth: 10,
                maxDomDepth: 10,
            },
            awaitPromise: true,
            userActivation: true,
        });
        if (response.type === 'success')
            return (0, bidiDeserializer_1.deserializeBidiValue)(response.result);
        if (response.type === 'exception')
            throw new js.JavaScriptErrorInEvaluate(response.exceptionDetails.text);
        throw new js.JavaScriptErrorInEvaluate('Unexpected response type: ' + JSON.stringify(response));
    }
    async rawEvaluateHandle(context, expression) {
        const response = await this._session.send('script.evaluate', {
            expression,
            target: this._target,
            resultOwnership: "root" /* bidi.Script.ResultOwnership.Root */, // Necessary for the handle to be returned.
            serializationOptions: { maxObjectDepth: 0, maxDomDepth: 0 },
            awaitPromise: true,
            userActivation: true,
        });
        if (response.type === 'success') {
            if ('handle' in response.result)
                return createHandle(context, response.result);
            throw new js.JavaScriptErrorInEvaluate('Cannot get handle: ' + JSON.stringify(response.result));
        }
        if (response.type === 'exception')
            throw new js.JavaScriptErrorInEvaluate(response.exceptionDetails.text);
        throw new js.JavaScriptErrorInEvaluate('Unexpected response type: ' + JSON.stringify(response));
    }
    async evaluateWithArguments(functionDeclaration, returnByValue, utilityScript, values, handles) {
        const response = await this._session.send('script.callFunction', {
            functionDeclaration,
            target: this._target,
            arguments: [
                { handle: utilityScript._objectId },
                ...values.map(bidiSerializer_1.BidiSerializer.serialize),
                ...handles.map(handle => ({ handle: handle._objectId })),
            ],
            resultOwnership: returnByValue ? undefined : "root" /* bidi.Script.ResultOwnership.Root */, // Necessary for the handle to be returned.
            serializationOptions: returnByValue ? {} : { maxObjectDepth: 0, maxDomDepth: 0 },
            awaitPromise: true,
            userActivation: true,
        });
        if (response.type === 'exception')
            throw new js.JavaScriptErrorInEvaluate(response.exceptionDetails.text);
        if (response.type === 'success') {
            if (returnByValue)
                return (0, utilityScriptSerializers_1.parseEvaluationResultValue)((0, bidiDeserializer_1.deserializeBidiValue)(response.result));
            return createHandle(utilityScript._context, response.result);
        }
        throw new js.JavaScriptErrorInEvaluate('Unexpected response type: ' + JSON.stringify(response));
    }
    async getProperties(handle) {
        const names = await handle.evaluate(object => {
            const names = [];
            const descriptors = Object.getOwnPropertyDescriptors(object);
            for (const name in descriptors) {
                if (descriptors[name]?.enumerable)
                    names.push(name);
            }
            return names;
        });
        const values = await Promise.all(names.map(async (name) => {
            const value = await this._rawCallFunction('(object, name) => object[name]', [{ handle: handle._objectId }, { type: 'string', value: name }], true, false);
            return createHandle(handle._context, value);
        }));
        const map = new Map();
        for (let i = 0; i < names.length; i++)
            map.set(names[i], values[i]);
        return map;
    }
    async releaseHandle(handle) {
        if (!handle._objectId)
            return;
        await this._session.send('script.disown', {
            target: this._target,
            handles: [handle._objectId],
        });
    }
    async nodeIdForElementHandle(handle) {
        const shared = await this._remoteValueForReference({ handle: handle._objectId });
        // TODO: store sharedId in the handle.
        if (!('sharedId' in shared))
            throw new Error('Element is not a node');
        return {
            sharedId: shared.sharedId,
        };
    }
    async remoteObjectForNodeId(context, nodeId) {
        const result = await this._remoteValueForReference(nodeId, true);
        if (!('handle' in result))
            throw new Error('Can\'t get remote object for nodeId');
        return createHandle(context, result);
    }
    async contentFrameIdForFrame(handle) {
        const contentWindow = await this._rawCallFunction('e => e.contentWindow', [{ handle: handle._objectId }]);
        if (contentWindow?.type === 'window')
            return contentWindow.value.context;
        return null;
    }
    async frameIdForWindowHandle(handle) {
        if (!handle._objectId)
            throw new Error('JSHandle is not a DOM node handle');
        const contentWindow = await this._remoteValueForReference({ handle: handle._objectId });
        if (contentWindow.type === 'window')
            return contentWindow.value.context;
        return null;
    }
    async _remoteValueForReference(reference, createHandle) {
        return await this._rawCallFunction('e => e', [reference], createHandle);
    }
    async _rawCallFunction(functionDeclaration, args, createHandle, awaitPromise = true) {
        const response = await this._session.send('script.callFunction', {
            functionDeclaration,
            target: this._target,
            arguments: args,
            // "Root" is necessary for the handle to be returned.
            resultOwnership: createHandle ? "root" /* bidi.Script.ResultOwnership.Root */ : "none" /* bidi.Script.ResultOwnership.None */,
            serializationOptions: { maxObjectDepth: 0, maxDomDepth: 0 },
            awaitPromise,
            userActivation: true,
        });
        if (response.type === 'exception')
            throw new js.JavaScriptErrorInEvaluate(response.exceptionDetails.text);
        if (response.type === 'success')
            return response.result;
        throw new js.JavaScriptErrorInEvaluate('Unexpected response type: ' + JSON.stringify(response));
    }
}
exports.BidiExecutionContext = BidiExecutionContext;
function renderPreview(remoteObject, nested = false) {
    switch (remoteObject.type) {
        case 'undefined':
        case 'null':
            return remoteObject.type;
        case 'number':
        case 'boolean':
        case 'string':
            return String(remoteObject.value);
        case 'bigint':
            return `${remoteObject.value}n`;
        case 'date':
            return String(new Date(remoteObject.value));
        case 'regexp':
            return String(new RegExp(remoteObject.value.pattern, remoteObject.value.flags));
        case 'node':
            return remoteObject.value?.localName || 'Node';
        case 'object':
            if (nested)
                return 'Object';
            const tokens = [];
            for (const [name, value] of remoteObject.value || []) {
                if (typeof name === 'string')
                    tokens.push(`${name}: ${renderPreview(value, true)}`);
            }
            return `{${tokens.join(', ')}}`;
        case 'array':
        case 'htmlcollection':
        case 'nodelist':
            if (nested || !remoteObject.value)
                return remoteObject.value ? `Array(${remoteObject.value.length})` : 'Array';
            return `[${remoteObject.value.map(v => renderPreview(v, true)).join(', ')}]`;
        case 'map':
            return remoteObject.value ? `Map(${remoteObject.value.length})` : 'Map';
        case 'set':
            return remoteObject.value ? `Set(${remoteObject.value.length})` : 'Set';
        case 'arraybuffer':
            return 'ArrayBuffer';
        case 'error':
            return 'Error';
        case 'function':
            return 'Function';
        case 'generator':
            return 'Generator';
        case 'promise':
            return 'Promise';
        case 'proxy':
            return 'Proxy';
        case 'symbol':
            return 'Symbol()';
        case 'typedarray':
            return 'TypedArray';
        case 'weakmap':
            return 'WeakMap';
        case 'weakset':
            return 'WeakSet';
        case 'window':
            return 'Window';
    }
}
function createHandle(context, remoteObject) {
    if (remoteObject.type === 'node') {
        (0, utils_1.assert)(context instanceof dom.FrameExecutionContext);
        return new dom.ElementHandle(context, remoteObject.handle);
    }
    const objectId = 'handle' in remoteObject ? remoteObject.handle : undefined;
    const preview = renderPreview(remoteObject);
    const handle = new js.JSHandle(context, remoteObject.type, preview, objectId, (0, bidiDeserializer_1.deserializeBidiValue)(remoteObject));
    handle._setPreview(preview);
    return handle;
}
