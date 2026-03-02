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
import { EventEmitter } from 'events';
import { SdkObject } from '../instrumentation';
import { Progress } from '../progress';
import type { CallMetadata } from '../instrumentation';
import type { copilotbrowserDispatcher } from './copilotbrowserDispatcher';
import type { RegisteredListener } from '../utils/eventsHelper';
import type * as channels from '@protocol/channels';
export declare function setMaxDispatchersForTest(value: number | undefined): void;
export declare class Dispatcher<Type extends SdkObject, ChannelType, ParentScopeType extends DispatcherScope> extends EventEmitter implements channels.Channel {
    readonly connection: DispatcherConnection;
    private _parent;
    private _dispatchers;
    protected _disposed: boolean;
    protected _eventListeners: RegisteredListener[];
    private _activeProgressControllers;
    readonly _guid: string;
    readonly _type: string;
    readonly _gcBucket: string;
    _object: Type;
    constructor(parent: ParentScopeType | DispatcherConnection, object: Type, type: string, initializer: channels.InitializerTraits<ChannelType>, gcBucket?: string);
    parentScope(): ParentScopeType;
    addObjectListener(eventName: (string | symbol), handler: (...args: any[]) => void): void;
    adopt(child: DispatcherScope): void;
    _runCommand(callMetadata: CallMetadata, method: string, validParams: any): Promise<unknown>;
    _dispatchEvent<T extends keyof channels.EventsTraits<ChannelType>>(method: T, params?: channels.EventsTraits<ChannelType>[T]): void;
    _dispose(reason?: 'gc'): void;
    protected _onDispose(): void;
    stopPendingOperations(error: Error): Promise<void>;
    private _disposeRecursively;
    _debugScopeState(): any;
    waitForEventInfo(): Promise<void>;
}
export type DispatcherScope = Dispatcher<SdkObject, any, any>;
export declare class RootDispatcher extends Dispatcher<SdkObject, any, any> {
    private readonly createcopilotbrowser?;
    private _initialized;
    constructor(connection: DispatcherConnection, createcopilotbrowser?: (scope: RootDispatcher, options: channels.RootInitializeParams) => Promise<copilotbrowserDispatcher>);
    initialize(params: channels.RootInitializeParams, progress: Progress): Promise<channels.RootInitializeResult>;
}
export declare class DispatcherConnection {
    readonly _dispatcherByGuid: Map<string, DispatcherScope>;
    readonly _dispatcherByObject: Map<any, DispatcherScope>;
    readonly _dispatchersByBucket: Map<string, Set<string>>;
    onmessage: (message: object) => void;
    private _waitOperations;
    private _isLocal;
    constructor(isLocal?: boolean);
    sendEvent(dispatcher: DispatcherScope, event: string, params: any): void;
    sendCreate(parent: DispatcherScope, type: string, guid: string, initializer: any): void;
    sendAdopt(parent: DispatcherScope, dispatcher: DispatcherScope): void;
    sendDispose(dispatcher: DispatcherScope, reason?: 'gc'): void;
    private _validatorToWireContext;
    private _validatorFromWireContext;
    private _tChannelImplFromWire;
    private _tChannelImplToWire;
    existingDispatcher<DispatcherType>(object: any): DispatcherType | undefined;
    registerDispatcher(dispatcher: DispatcherScope): void;
    maybeDisposeStaleDispatchers(gcBucket: string): void;
    dispatch(message: object): Promise<void>;
    private _doSlowMo;
}
