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
exports.tType = exports.tChannel = exports.tEnum = exports.tObject = exports.tArray = exports.tOptional = exports.tAny = exports.tUndefined = exports.tBinary = exports.tString = exports.tBoolean = exports.tInt = exports.tFloat = exports.scheme = exports.ValidationError = void 0;
exports.findValidator = findValidator;
exports.maybeFindValidator = maybeFindValidator;
exports.createMetadataValidator = createMetadataValidator;
class ValidationError extends Error {
}
exports.ValidationError = ValidationError;
exports.scheme = {};
function findValidator(type, method, kind) {
    const validator = maybeFindValidator(type, method, kind);
    if (!validator)
        throw new ValidationError(`Unknown scheme for ${kind}: ${type}.${method}`);
    return validator;
}
function maybeFindValidator(type, method, kind) {
    const schemeName = type + (kind === 'Initializer' ? '' : method[0].toUpperCase() + method.substring(1)) + kind;
    return exports.scheme[schemeName];
}
function createMetadataValidator() {
    return (0, exports.tOptional)(exports.scheme['Metadata']);
}
const tFloat = (arg, path, context) => {
    if (arg instanceof Number)
        return arg.valueOf();
    if (typeof arg === 'number')
        return arg;
    throw new ValidationError(`${path}: expected float, got ${typeof arg}`);
};
exports.tFloat = tFloat;
const tInt = (arg, path, context) => {
    let value;
    if (arg instanceof Number)
        value = arg.valueOf();
    else if (typeof arg === 'number')
        value = arg;
    else
        throw new ValidationError(`${path}: expected integer, got ${typeof arg}`);
    if (!Number.isInteger(value))
        throw new ValidationError(`${path}: expected integer, got float ${value}`);
    return value;
};
exports.tInt = tInt;
const tBoolean = (arg, path, context) => {
    if (arg instanceof Boolean)
        return arg.valueOf();
    if (typeof arg === 'boolean')
        return arg;
    throw new ValidationError(`${path}: expected boolean, got ${typeof arg}`);
};
exports.tBoolean = tBoolean;
const tString = (arg, path, context) => {
    if (arg instanceof String)
        return arg.valueOf();
    if (typeof arg === 'string')
        return arg;
    throw new ValidationError(`${path}: expected string, got ${typeof arg}`);
};
exports.tString = tString;
const tBinary = (arg, path, context) => {
    if (context.binary === 'fromBase64') {
        if (arg instanceof String)
            return Buffer.from(arg.valueOf(), 'base64');
        if (typeof arg === 'string')
            return Buffer.from(arg, 'base64');
        throw new ValidationError(`${path}: expected base64-encoded buffer, got ${typeof arg}`);
    }
    if (context.binary === 'toBase64') {
        if (!(arg instanceof Buffer))
            throw new ValidationError(`${path}: expected Buffer, got ${typeof arg}`);
        return arg.toString('base64');
    }
    if (context.binary === 'buffer') {
        // TODO: support custom binary types.
        if (!(arg instanceof Buffer) && !(arg instanceof Object))
            throw new ValidationError(`${path}: expected Buffer, got ${typeof arg}`);
        return arg;
    }
    throw new ValidationError(`Unsupported binary behavior "${context.binary}"`);
};
exports.tBinary = tBinary;
const tUndefined = (arg, path, context) => {
    if (Object.is(arg, undefined))
        return arg;
    throw new ValidationError(`${path}: expected undefined, got ${typeof arg}`);
};
exports.tUndefined = tUndefined;
const tAny = (arg, path, context) => {
    return arg;
};
exports.tAny = tAny;
const tOptional = (v) => {
    return (arg, path, context) => {
        if (Object.is(arg, undefined))
            return arg;
        return v(arg, path, context);
    };
};
exports.tOptional = tOptional;
const tArray = (v) => {
    return (arg, path, context) => {
        if (!Array.isArray(arg))
            throw new ValidationError(`${path}: expected array, got ${typeof arg}`);
        return arg.map((x, index) => v(x, path + '[' + index + ']', context));
    };
};
exports.tArray = tArray;
const tObject = (s) => {
    return (arg, path, context) => {
        if (Object.is(arg, null))
            throw new ValidationError(`${path}: expected object, got null`);
        if (typeof arg !== 'object')
            throw new ValidationError(`${path}: expected object, got ${typeof arg}`);
        const result = {};
        for (const [key, v] of Object.entries(s)) {
            const value = v(arg[key], path ? path + '.' + key : key, context);
            if (!Object.is(value, undefined))
                result[key] = value;
        }
        if (context.isUnderTest()) {
            for (const [key, value] of Object.entries(arg)) {
                if (key.startsWith('__testHook'))
                    result[key] = value;
            }
        }
        return result;
    };
};
exports.tObject = tObject;
const tEnum = (e) => {
    return (arg, path, context) => {
        if (!e.includes(arg))
            throw new ValidationError(`${path}: expected one of (${e.join('|')})`);
        return arg;
    };
};
exports.tEnum = tEnum;
const tChannel = (names) => {
    return (arg, path, context) => {
        return context.tChannelImpl(names, arg, path, context);
    };
};
exports.tChannel = tChannel;
const tType = (name) => {
    return (arg, path, context) => {
        const v = exports.scheme[name];
        if (!v)
            throw new ValidationError(path + ': unknown type "' + name + '"');
        return v(arg, path, context);
    };
};
exports.tType = tType;
