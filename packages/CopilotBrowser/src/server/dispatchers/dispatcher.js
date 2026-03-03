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
exports.DispatcherConnection = exports.RootDispatcher = exports.Dispatcher = void 0;
exports.setMaxDispatchersForTest = setMaxDispatchersForTest;
const events_1 = require("events");
const eventsHelper_1 = require("../utils/eventsHelper");
const validator_1 = require("../../protocol/validator");
const utils_1 = require("../../utils");
const debug_1 = require("../utils/debug");
const errors_1 = require("../errors");
const instrumentation_1 = require("../instrumentation");
const protocolError_1 = require("../protocolError");
const callLog_1 = require("../callLog");
const protocolMetainfo_1 = require("../../utils/isomorphic/protocolMetainfo");
const progress_1 = require("../progress");
const metadataValidator = (0, validator_1.createMetadataValidator)();
let maxDispatchersOverride;
function setMaxDispatchersForTest(value) {
    maxDispatchersOverride = value;
}
function maxDispatchersForBucket(gcBucket) {
    return maxDispatchersOverride ?? {
        'JSHandle': 100000,
        'ElementHandle': 100000,
    }[gcBucket] ?? 10000;
}
class Dispatcher extends events_1.EventEmitter {
    connection;
    _parent;
    _dispatchers = new Map();
    _disposed = false;
    _eventListeners = [];
    _activeProgressControllers = new Set();
    _guid;
    _type;
    _gcBucket;
    _object;
    constructor(parent, object, type, initializer, gcBucket) {
        super();
        this.connection = parent instanceof DispatcherConnection ? parent : parent.connection;
        this._parent = parent instanceof DispatcherConnection ? undefined : parent;
        const guid = object.guid;
        this._guid = guid;
        this._type = type;
        this._object = object;
        this._gcBucket = gcBucket ?? type;
        this.connection.registerDispatcher(this);
        if (this._parent) {
            (0, utils_1.assert)(!this._parent._dispatchers.has(guid));
            this._parent._dispatchers.set(guid, this);
        }
        if (this._parent)
            this.connection.sendCreate(this._parent, type, guid, initializer);
        this.connection.maybeDisposeStaleDispatchers(this._gcBucket);
    }
    parentScope() {
        return this._parent;
    }
    addObjectListener(eventName, handler) {
        this._eventListeners.push(eventsHelper_1.eventsHelper.addEventListener(this._object, eventName, handler));
    }
    adopt(child) {
        if (child._parent === this)
            return;
        const oldParent = child._parent;
        oldParent._dispatchers.delete(child._guid);
        this._dispatchers.set(child._guid, child);
        child._parent = this;
        this.connection.sendAdopt(this, child);
    }
    async _runCommand(callMetadata, method, validParams) {
        const controller = progress_1.ProgressController.createForSdkObject(this._object, callMetadata);
        this._activeProgressControllers.add(controller);
        try {
            return await controller.run(progress => this[method](validParams, progress), validParams?.timeout);
        }
        finally {
            this._activeProgressControllers.delete(controller);
        }
    }
    _dispatchEvent(method, params) {
        if (this._disposed) {
            if ((0, debug_1.isUnderTest)())
                throw new Error(`${this._guid} is sending "${String(method)}" event after being disposed`);
            // Just ignore this event outside of tests.
            return;
        }
        this.connection.sendEvent(this, method, params);
    }
    _dispose(reason) {
        this._disposeRecursively(new errors_1.TargetClosedError(this._object.closeReason()));
        this.connection.sendDispose(this, reason);
    }
    _onDispose() {
    }
    async stopPendingOperations(error) {
        const controllers = [];
        const collect = (dispatcher) => {
            controllers.push(...dispatcher._activeProgressControllers);
            for (const child of [...dispatcher._dispatchers.values()])
                collect(child);
        };
        collect(this);
        await Promise.all(controllers.map(controller => controller.abort(error)));
    }
    _disposeRecursively(error) {
        (0, utils_1.assert)(!this._disposed, `${this._guid} is disposed more than once`);
        for (const controller of this._activeProgressControllers) {
            if (!controller.metadata.potentiallyClosesScope)
                controller.abort(error).catch(() => { });
        }
        this._onDispose();
        this._disposed = true;
        eventsHelper_1.eventsHelper.removeEventListeners(this._eventListeners);
        // Clean up from parent and connection.
        this._parent?._dispatchers.delete(this._guid);
        const list = this.connection._dispatchersByBucket.get(this._gcBucket);
        list?.delete(this._guid);
        this.connection._dispatcherByGuid.delete(this._guid);
        this.connection._dispatcherByObject.delete(this._object);
        // Dispose all children.
        for (const dispatcher of [...this._dispatchers.values()])
            dispatcher._disposeRecursively(error);
        this._dispatchers.clear();
    }
    _debugScopeState() {
        return {
            _guid: this._guid,
            objects: Array.from(this._dispatchers.values()).map(o => o._debugScopeState()),
        };
    }
    async waitForEventInfo() {
        // Instrumentation takes care of this.
    }
}
exports.Dispatcher = Dispatcher;
class RootDispatcher extends Dispatcher {
    createcopilotbrowser;
    _initialized = false;
    constructor(connection, createcopilotbrowser) {
        super(connection, (0, instrumentation_1.createRootSdkObject)(), 'Root', {});
        this.createcopilotbrowser = createcopilotbrowser;
    }
    async initialize(params, progress) {
        // Note: progress is deliberately ignored here.
        (0, utils_1.assert)(this.createcopilotbrowser);
        (0, utils_1.assert)(!this._initialized);
        this._initialized = true;
        return {
            copilotbrowser: await this.createcopilotbrowser(this, params),
        };
    }
}
exports.RootDispatcher = RootDispatcher;
class DispatcherConnection {
    _dispatcherByGuid = new Map();
    _dispatcherByObject = new Map();
    _dispatchersByBucket = new Map();
    onmessage = (message) => { };
    _waitOperations = new Map();
    _isLocal;
    constructor(isLocal) {
        this._isLocal = !!isLocal;
    }
    sendEvent(dispatcher, event, params) {
        const validator = (0, validator_1.findValidator)(dispatcher._type, event, 'Event');
        params = validator(params, '', this._validatorToWireContext());
        this.onmessage({ guid: dispatcher._guid, method: event, params });
    }
    sendCreate(parent, type, guid, initializer) {
        const validator = (0, validator_1.findValidator)(type, '', 'Initializer');
        initializer = validator(initializer, '', this._validatorToWireContext());
        this.onmessage({ guid: parent._guid, method: '__create__', params: { type, initializer, guid } });
    }
    sendAdopt(parent, dispatcher) {
        this.onmessage({ guid: parent._guid, method: '__adopt__', params: { guid: dispatcher._guid } });
    }
    sendDispose(dispatcher, reason) {
        this.onmessage({ guid: dispatcher._guid, method: '__dispose__', params: { reason } });
    }
    _validatorToWireContext() {
        return {
            tChannelImpl: this._tChannelImplToWire.bind(this),
            binary: this._isLocal ? 'buffer' : 'toBase64',
            isUnderTest: debug_1.isUnderTest,
        };
    }
    _validatorFromWireContext() {
        return {
            tChannelImpl: this._tChannelImplFromWire.bind(this),
            binary: this._isLocal ? 'buffer' : 'fromBase64',
            isUnderTest: debug_1.isUnderTest,
        };
    }
    _tChannelImplFromWire(names, arg, path, context) {
        if (arg && typeof arg === 'object' && typeof arg.guid === 'string') {
            const guid = arg.guid;
            const dispatcher = this._dispatcherByGuid.get(guid);
            if (!dispatcher)
                throw new validator_1.ValidationError(`${path}: no object with guid ${guid}`);
            if (names !== '*' && !names.includes(dispatcher._type))
                throw new validator_1.ValidationError(`${path}: object with guid ${guid} has type ${dispatcher._type}, expected ${names.toString()}`);
            return dispatcher;
        }
        throw new validator_1.ValidationError(`${path}: expected guid for ${names.toString()}`);
    }
    _tChannelImplToWire(names, arg, path, context) {
        if (arg instanceof Dispatcher) {
            if (names !== '*' && !names.includes(arg._type))
                throw new validator_1.ValidationError(`${path}: dispatcher with guid ${arg._guid} has type ${arg._type}, expected ${names.toString()}`);
            return { guid: arg._guid };
        }
        throw new validator_1.ValidationError(`${path}: expected dispatcher ${names.toString()}`);
    }
    existingDispatcher(object) {
        return this._dispatcherByObject.get(object);
    }
    registerDispatcher(dispatcher) {
        (0, utils_1.assert)(!this._dispatcherByGuid.has(dispatcher._guid));
        this._dispatcherByGuid.set(dispatcher._guid, dispatcher);
        this._dispatcherByObject.set(dispatcher._object, dispatcher);
        let list = this._dispatchersByBucket.get(dispatcher._gcBucket);
        if (!list) {
            list = new Set();
            this._dispatchersByBucket.set(dispatcher._gcBucket, list);
        }
        list.add(dispatcher._guid);
    }
    maybeDisposeStaleDispatchers(gcBucket) {
        const maxDispatchers = maxDispatchersForBucket(gcBucket);
        const list = this._dispatchersByBucket.get(gcBucket);
        if (!list || list.size <= maxDispatchers)
            return;
        const dispatchersArray = [...list];
        const disposeCount = (maxDispatchers / 10) | 0;
        this._dispatchersByBucket.set(gcBucket, new Set(dispatchersArray.slice(disposeCount)));
        for (let i = 0; i < disposeCount; ++i) {
            const d = this._dispatcherByGuid.get(dispatchersArray[i]);
            if (!d)
                continue;
            d._dispose('gc');
        }
    }
    async dispatch(message) {
        const { id, guid, method, params, metadata } = message;
        const dispatcher = this._dispatcherByGuid.get(guid);
        if (!dispatcher) {
            this.onmessage({ id, error: (0, errors_1.serializeError)(new errors_1.TargetClosedError(undefined)) });
            return;
        }
        let validParams;
        let validMetadata;
        try {
            const validator = (0, validator_1.findValidator)(dispatcher._type, method, 'Params');
            const validatorContext = this._validatorFromWireContext();
            validParams = validator(params, '', validatorContext);
            validMetadata = metadataValidator(metadata, '', validatorContext);
            if (typeof dispatcher[method] !== 'function')
                throw new Error(`Mismatching dispatcher: "${dispatcher._type}" does not implement "${method}"`);
        }
        catch (e) {
            this.onmessage({ id, error: (0, errors_1.serializeError)(e) });
            return;
        }
        const metainfo = protocolMetainfo_1.methodMetainfo.get(dispatcher._type + '.' + method);
        if (metainfo?.internal) {
            // For non-js ports, it is easier to detect internal calls here rather
            // than generate protocol metainfo for each language.
            validMetadata.internal = true;
        }
        const sdkObject = dispatcher._object;
        const callMetadata = {
            id: `call@${id}`,
            location: validMetadata.location,
            title: validMetadata.title,
            internal: validMetadata.internal,
            stepId: validMetadata.stepId,
            objectId: sdkObject.guid,
            pageId: sdkObject.attribution?.page?.guid,
            frameId: sdkObject.attribution?.frame?.guid,
            startTime: (0, utils_1.monotonicTime)(),
            endTime: 0,
            type: dispatcher._type,
            method,
            params: params || {},
            log: [],
        };
        if (params?.info?.waitId) {
            // Process logs for waitForNavigation/waitForLoadState/etc.
            const info = params.info;
            switch (info.phase) {
                case 'before': {
                    this._waitOperations.set(info.waitId, callMetadata);
                    await sdkObject.instrumentation.onBeforeCall(sdkObject, callMetadata);
                    this.onmessage({ id });
                    return;
                }
                case 'log': {
                    const originalMetadata = this._waitOperations.get(info.waitId);
                    originalMetadata.log.push(info.message);
                    sdkObject.instrumentation.onCallLog(sdkObject, originalMetadata, 'api', info.message);
                    this.onmessage({ id });
                    return;
                }
                case 'after': {
                    const originalMetadata = this._waitOperations.get(info.waitId);
                    originalMetadata.endTime = (0, utils_1.monotonicTime)();
                    originalMetadata.error = info.error ? { error: { name: 'Error', message: info.error } } : undefined;
                    this._waitOperations.delete(info.waitId);
                    await sdkObject.instrumentation.onAfterCall(sdkObject, originalMetadata);
                    this.onmessage({ id });
                    return;
                }
            }
        }
        await sdkObject.instrumentation.onBeforeCall(sdkObject, callMetadata);
        const response = { id };
        try {
            // If the dispatcher has been disposed while running the instrumentation call, error out.
            if (this._dispatcherByGuid.get(guid) !== dispatcher)
                throw new errors_1.TargetClosedError(sdkObject.closeReason());
            const result = await dispatcher._runCommand(callMetadata, method, validParams);
            const validator = (0, validator_1.findValidator)(dispatcher._type, method, 'Result');
            response.result = validator(result, '', this._validatorToWireContext());
            callMetadata.result = result;
        }
        catch (e) {
            if ((0, errors_1.isTargetClosedError)(e)) {
                const reason = sdkObject.closeReason();
                if (reason)
                    (0, utils_1.rewriteErrorMessage)(e, reason);
            }
            else if ((0, protocolError_1.isProtocolError)(e)) {
                if (e.type === 'closed')
                    e = new errors_1.TargetClosedError(sdkObject.closeReason(), e.browserLogMessage());
                else if (e.type === 'crashed')
                    (0, utils_1.rewriteErrorMessage)(e, 'Target crashed ' + e.browserLogMessage());
            }
            response.error = (0, errors_1.serializeError)(e);
            // The command handler could have set error in the metadata, do not reset it if there was no exception.
            callMetadata.error = response.error;
        }
        finally {
            callMetadata.endTime = (0, utils_1.monotonicTime)();
            await sdkObject.instrumentation.onAfterCall(sdkObject, callMetadata);
            if (metainfo?.slowMo)
                await this._doSlowMo(sdkObject);
        }
        if (response.error)
            response.log = (0, callLog_1.compressCallLog)(callMetadata.log);
        this.onmessage(response);
    }
    async _doSlowMo(sdkObject) {
        const slowMo = sdkObject.attribution.browser?.options.slowMo;
        if (slowMo)
            await new Promise(f => setTimeout(f, slowMo));
    }
}
exports.DispatcherConnection = DispatcherConnection;
