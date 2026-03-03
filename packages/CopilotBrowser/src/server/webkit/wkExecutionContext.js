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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WKExecutionContext = void 0;
exports.createHandle = createHandle;
const js = __importStar(require("../javascript"));
const dom = __importStar(require("../dom"));
const protocolError_1 = require("../protocolError");
const assert_1 = require("../../utils/isomorphic/assert");
const utilityScriptSerializers_1 = require("../../utils/isomorphic/utilityScriptSerializers");
class WKExecutionContext {
    _session;
    _contextId;
    constructor(session, contextId) {
        this._session = session;
        this._contextId = contextId;
    }
    async rawEvaluateJSON(expression) {
        try {
            const response = await this._session.send('Runtime.evaluate', {
                expression,
                contextId: this._contextId,
                returnByValue: true
            });
            if (response.wasThrown)
                throw new js.JavaScriptErrorInEvaluate(response.result.description);
            return response.result.value;
        }
        catch (error) {
            throw rewriteError(error);
        }
    }
    async rawEvaluateHandle(context, expression) {
        try {
            const response = await this._session.send('Runtime.evaluate', {
                expression,
                contextId: this._contextId,
                returnByValue: false
            });
            if (response.wasThrown)
                throw new js.JavaScriptErrorInEvaluate(response.result.description);
            return createHandle(context, response.result);
        }
        catch (error) {
            throw rewriteError(error);
        }
    }
    async evaluateWithArguments(expression, returnByValue, utilityScript, values, handles) {
        try {
            const response = await this._session.send('Runtime.callFunctionOn', {
                functionDeclaration: expression,
                objectId: utilityScript._objectId,
                arguments: [
                    { objectId: utilityScript._objectId },
                    ...values.map(value => ({ value })),
                    ...handles.map(handle => ({ objectId: handle._objectId })),
                ],
                returnByValue,
                emulateUserGesture: true,
                awaitPromise: true
            });
            if (response.wasThrown)
                throw new js.JavaScriptErrorInEvaluate(response.result.description);
            if (returnByValue)
                return (0, utilityScriptSerializers_1.parseEvaluationResultValue)(response.result.value);
            return createHandle(utilityScript._context, response.result);
        }
        catch (error) {
            throw rewriteError(error);
        }
    }
    async getProperties(object) {
        const response = await this._session.send('Runtime.getProperties', {
            objectId: object._objectId,
            ownProperties: true
        });
        const result = new Map();
        for (const property of response.properties) {
            if (!property.enumerable || !property.value)
                continue;
            result.set(property.name, createHandle(object._context, property.value));
        }
        return result;
    }
    async releaseHandle(handle) {
        if (!handle._objectId)
            return;
        await this._session.send('Runtime.releaseObject', { objectId: handle._objectId });
    }
}
exports.WKExecutionContext = WKExecutionContext;
function potentiallyUnserializableValue(remoteObject) {
    const value = remoteObject.value;
    const isUnserializable = remoteObject.type === 'number' && ['NaN', '-Infinity', 'Infinity', '-0'].includes(remoteObject.description);
    return isUnserializable ? js.parseUnserializableValue(remoteObject.description) : value;
}
function rewriteError(error) {
    if (error.message.includes('Object has too long reference chain'))
        throw new Error('Cannot serialize result: object reference chain is too long.');
    if (!js.isJavaScriptErrorInEvaluate(error) && !(0, protocolError_1.isSessionClosedError)(error))
        return new Error('Execution context was destroyed, most likely because of a navigation.');
    return error;
}
function renderPreview(object) {
    if (object.type === 'undefined')
        return 'undefined';
    if ('value' in object)
        return String(object.value);
    if (object.description === 'Object' && object.preview) {
        const tokens = [];
        for (const { name, value } of object.preview.properties)
            tokens.push(`${name}: ${value}`);
        return `{${tokens.join(', ')}}`;
    }
    if (object.subtype === 'array' && object.preview)
        return js.sparseArrayToString(object.preview.properties);
    return object.description;
}
function createHandle(context, remoteObject) {
    if (remoteObject.subtype === 'node') {
        (0, assert_1.assert)(context instanceof dom.FrameExecutionContext);
        return new dom.ElementHandle(context, remoteObject.objectId);
    }
    const isPromise = remoteObject.className === 'Promise';
    return new js.JSHandle(context, isPromise ? 'promise' : remoteObject.subtype || remoteObject.type, renderPreview(remoteObject), remoteObject.objectId, potentiallyUnserializableValue(remoteObject));
}
