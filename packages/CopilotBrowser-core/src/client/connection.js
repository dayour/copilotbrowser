"use strict";
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License");
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
exports.Connection = void 0;
const eventEmitter_1 = require("./eventEmitter");
const android_1 = require("./android");
const artifact_1 = require("./artifact");
const browser_1 = require("./browser");
const browserContext_1 = require("./browserContext");
const browserType_1 = require("./browserType");
const cdpSession_1 = require("./cdpSession");
const channelOwner_1 = require("./channelOwner");
const clientInstrumentation_1 = require("./clientInstrumentation");
const dialog_1 = require("./dialog");
const electron_1 = require("./electron");
const elementHandle_1 = require("./elementHandle");
const errors_1 = require("./errors");
const fetch_1 = require("./fetch");
const frame_1 = require("./frame");
const jsHandle_1 = require("./jsHandle");
const jsonPipe_1 = require("./jsonPipe");
const localUtils_1 = require("./localUtils");
const network_1 = require("./network");
const page_1 = require("./page");
const copilotbrowser_1 = require("./copilotbrowser");
const stream_1 = require("./stream");
const tracing_1 = require("./tracing");
const worker_1 = require("./worker");
const writableStream_1 = require("./writableStream");
const validator_1 = require("../protocol/validator");
const stackTrace_1 = require("../utils/isomorphic/stackTrace");
const pageAgent_1 = require("./pageAgent");
class Root extends channelOwner_1.ChannelOwner {
    constructor(connection) {
        super(connection, 'Root', '', {});
    }
    async initialize() {
        return copilotbrowser_1.copilotbrowser.from((await this._channel.initialize({
            sdkLanguage: 'javascript',
        })).copilotbrowser);
    }
}
class DummyChannelOwner extends channelOwner_1.ChannelOwner {
}
class Connection extends eventEmitter_1.EventEmitter {
    _objects = new Map();
    onmessage = (message) => { };
    _lastId = 0;
    _callbacks = new Map();
    _rootObject;
    _closedError;
    _isRemote = false;
    _localUtils;
    _rawBuffers = false;
    // Some connections allow resolving in-process dispatchers.
    toImpl;
    _tracingCount = 0;
    _instrumentation;
    // Used from @copilotbrowser/test fixtures -> TODO remove?
    headers;
    constructor(platform, localUtils, instrumentation, headers = []) {
        super(platform);
        this._instrumentation = instrumentation || (0, clientInstrumentation_1.createInstrumentation)();
        this._localUtils = localUtils;
        this._rootObject = new Root(this);
        this.headers = headers;
    }
    markAsRemote() {
        this._isRemote = true;
    }
    isRemote() {
        return this._isRemote;
    }
    useRawBuffers() {
        this._rawBuffers = true;
    }
    rawBuffers() {
        return this._rawBuffers;
    }
    localUtils() {
        return this._localUtils;
    }
    async initializecopilotbrowser() {
        return await this._rootObject.initialize();
    }
    getObjectWithKnownName(guid) {
        return this._objects.get(guid);
    }
    setIsTracing(isTracing) {
        if (isTracing)
            this._tracingCount++;
        else
            this._tracingCount--;
    }
    async sendMessageToServer(object, method, params, options) {
        if (this._closedError)
            throw this._closedError;
        if (object._wasCollected)
            throw new Error('The object has been collected to prevent unbounded heap growth.');
        const guid = object._guid;
        const type = object._type;
        const id = ++this._lastId;
        const message = { id, guid, method, params };
        if (this._platform.isLogEnabled('channel')) {
            // Do not include metadata in debug logs to avoid noise.
            this._platform.log('channel', 'SEND> ' + JSON.stringify(message));
        }
        const location = options.frames?.[0] ? { file: options.frames[0].file, line: options.frames[0].line, column: options.frames[0].column } : undefined;
        const metadata = { title: options.title, location, internal: options.internal, stepId: options.stepId };
        if (this._tracingCount && options.frames && type !== 'LocalUtils')
            this._localUtils?.addStackToTracingNoReply({ callData: { stack: options.frames ?? [], id } }).catch(() => { });
        // We need to exit zones before calling into the server, otherwise
        // when we receive events from the server, we would be in an API zone.
        this._platform.zones.empty.run(() => this.onmessage({ ...message, metadata }));
        return await new Promise((resolve, reject) => this._callbacks.set(id, { resolve, reject, title: options.title, type, method }));
    }
    _validatorFromWireContext() {
        return {
            tChannelImpl: this._tChannelImplFromWire.bind(this),
            binary: this._rawBuffers ? 'buffer' : 'fromBase64',
            isUnderTest: () => this._platform.isUnderTest(),
        };
    }
    dispatch(message) {
        if (this._closedError)
            return;
        const { id, guid, method, params, result, error, log } = message;
        if (id) {
            if (this._platform.isLogEnabled('channel'))
                this._platform.log('channel', '<RECV ' + JSON.stringify(message));
            const callback = this._callbacks.get(id);
            if (!callback)
                throw new Error(`Cannot find command to respond: ${id}`);
            this._callbacks.delete(id);
            if (error && !result) {
                const parsedError = (0, errors_1.parseError)(error);
                (0, stackTrace_1.rewriteErrorMessage)(parsedError, parsedError.message + formatCallLog(this._platform, log));
                callback.reject(parsedError);
            }
            else {
                const validator = (0, validator_1.findValidator)(callback.type, callback.method, 'Result');
                callback.resolve(validator(result, '', this._validatorFromWireContext()));
            }
            return;
        }
        if (this._platform.isLogEnabled('channel'))
            this._platform.log('channel', '<EVENT ' + JSON.stringify(message));
        if (method === '__create__') {
            this._createRemoteObject(guid, params.type, params.guid, params.initializer);
            return;
        }
        const object = this._objects.get(guid);
        if (!object)
            throw new Error(`Cannot find object to "${method}": ${guid}`);
        if (method === '__adopt__') {
            const child = this._objects.get(params.guid);
            if (!child)
                throw new Error(`Unknown new child: ${params.guid}`);
            object._adopt(child);
            return;
        }
        if (method === '__dispose__') {
            object._dispose(params.reason);
            return;
        }
        const validator = (0, validator_1.findValidator)(object._type, method, 'Event');
        object._channel.emit(method, validator(params, '', this._validatorFromWireContext()));
    }
    close(cause) {
        if (this._closedError)
            return;
        this._closedError = new errors_1.TargetClosedError(cause);
        for (const callback of this._callbacks.values())
            callback.reject(this._closedError);
        this._callbacks.clear();
        this.emit('close');
    }
    _tChannelImplFromWire(names, arg, path, context) {
        if (arg && typeof arg === 'object' && typeof arg.guid === 'string') {
            const object = this._objects.get(arg.guid);
            if (!object)
                throw new Error(`Object with guid ${arg.guid} was not bound in the connection`);
            if (names !== '*' && !names.includes(object._type))
                throw new validator_1.ValidationError(`${path}: expected channel ${names.toString()}`);
            return object._channel;
        }
        throw new validator_1.ValidationError(`${path}: expected channel ${names.toString()}`);
    }
    _createRemoteObject(parentGuid, type, guid, initializer) {
        const parent = this._objects.get(parentGuid);
        if (!parent)
            throw new Error(`Cannot find parent object ${parentGuid} to create ${guid}`);
        let result;
        const validator = (0, validator_1.findValidator)(type, '', 'Initializer');
        initializer = validator(initializer, '', this._validatorFromWireContext());
        switch (type) {
            case 'Android':
                result = new android_1.Android(parent, type, guid, initializer);
                break;
            case 'AndroidSocket':
                result = new android_1.AndroidSocket(parent, type, guid, initializer);
                break;
            case 'AndroidDevice':
                result = new android_1.AndroidDevice(parent, type, guid, initializer);
                break;
            case 'APIRequestContext':
                result = new fetch_1.APIRequestContext(parent, type, guid, initializer);
                break;
            case 'Artifact':
                result = new artifact_1.Artifact(parent, type, guid, initializer);
                break;
            case 'BindingCall':
                result = new page_1.BindingCall(parent, type, guid, initializer);
                break;
            case 'Browser':
                result = new browser_1.Browser(parent, type, guid, initializer);
                break;
            case 'BrowserContext':
                result = new browserContext_1.BrowserContext(parent, type, guid, initializer);
                break;
            case 'BrowserType':
                result = new browserType_1.BrowserType(parent, type, guid, initializer);
                break;
            case 'CDPSession':
                result = new cdpSession_1.CDPSession(parent, type, guid, initializer);
                break;
            case 'Dialog':
                result = new dialog_1.Dialog(parent, type, guid, initializer);
                break;
            case 'Electron':
                result = new electron_1.Electron(parent, type, guid, initializer);
                break;
            case 'ElectronApplication':
                result = new electron_1.ElectronApplication(parent, type, guid, initializer);
                break;
            case 'ElementHandle':
                result = new elementHandle_1.ElementHandle(parent, type, guid, initializer);
                break;
            case 'Frame':
                result = new frame_1.Frame(parent, type, guid, initializer);
                break;
            case 'JSHandle':
                result = new jsHandle_1.JSHandle(parent, type, guid, initializer);
                break;
            case 'JsonPipe':
                result = new jsonPipe_1.JsonPipe(parent, type, guid, initializer);
                break;
            case 'LocalUtils':
                result = new localUtils_1.LocalUtils(parent, type, guid, initializer);
                if (!this._localUtils)
                    this._localUtils = result;
                break;
            case 'Page':
                result = new page_1.Page(parent, type, guid, initializer);
                break;
            case 'PageAgent':
                result = new pageAgent_1.PageAgent(parent, type, guid, initializer);
                break;
            case 'copilotbrowser':
                result = new copilotbrowser_1.copilotbrowser(parent, type, guid, initializer);
                break;
            case 'Request':
                result = new network_1.Request(parent, type, guid, initializer);
                break;
            case 'Response':
                result = new network_1.Response(parent, type, guid, initializer);
                break;
            case 'Route':
                result = new network_1.Route(parent, type, guid, initializer);
                break;
            case 'Stream':
                result = new stream_1.Stream(parent, type, guid, initializer);
                break;
            case 'SocksSupport':
                result = new DummyChannelOwner(parent, type, guid, initializer);
                break;
            case 'Tracing':
                result = new tracing_1.Tracing(parent, type, guid, initializer);
                break;
            case 'WebSocket':
                result = new network_1.WebSocket(parent, type, guid, initializer);
                break;
            case 'WebSocketRoute':
                result = new network_1.WebSocketRoute(parent, type, guid, initializer);
                break;
            case 'Worker':
                result = new worker_1.Worker(parent, type, guid, initializer);
                break;
            case 'WritableStream':
                result = new writableStream_1.WritableStream(parent, type, guid, initializer);
                break;
            default:
                throw new Error('Missing type ' + type);
        }
        return result;
    }
}
exports.Connection = Connection;
function formatCallLog(platform, log) {
    if (!log || !log.some(l => !!l))
        return '';
    return `
Call log:
${platform.colors.dim(log.join('\n'))}
`;
}
