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
import type { CRSession } from './crConnection';
import type { Protocol } from './protocol';
import type * as types from '../types';
export declare function getExceptionMessage(exceptionDetails: Protocol.Runtime.ExceptionDetails): string;
export declare function releaseObject(client: CRSession, objectId: string): Promise<void>;
export declare function saveProtocolStream(client: CRSession, handle: string, path: string): Promise<void>;
export declare function readProtocolStream(client: CRSession, handle: string): Promise<Buffer>;
export declare function toConsoleMessageLocation(stackTrace: Protocol.Runtime.StackTrace | undefined): types.ConsoleMessageLocation;
export declare function exceptionToError(exceptionDetails: Protocol.Runtime.ExceptionDetails): Error;
export declare function toModifiersMask(modifiers: Set<types.KeyboardModifier>): number;
export declare function toButtonsMask(buttons: Set<types.MouseButton>): number;
