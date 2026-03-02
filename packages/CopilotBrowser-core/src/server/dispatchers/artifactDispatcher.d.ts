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
import { Dispatcher } from './dispatcher';
import type { DispatcherScope } from './dispatcher';
import type { Artifact } from '../artifact';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';
export declare class ArtifactDispatcher extends Dispatcher<Artifact, channels.ArtifactChannel, DispatcherScope> implements channels.ArtifactChannel {
    _type_Artifact: boolean;
    static from(parentScope: DispatcherScope, artifact: Artifact): ArtifactDispatcher;
    static fromNullable(parentScope: DispatcherScope, artifact: Artifact | undefined): ArtifactDispatcher | undefined;
    private constructor();
    pathAfterFinished(params: channels.ArtifactPathAfterFinishedParams, progress: Progress): Promise<channels.ArtifactPathAfterFinishedResult>;
    saveAs(params: channels.ArtifactSaveAsParams, progress: Progress): Promise<channels.ArtifactSaveAsResult>;
    saveAsStream(params: channels.ArtifactSaveAsStreamParams, progress: Progress): Promise<channels.ArtifactSaveAsStreamResult>;
    stream(params: channels.ArtifactStreamParams, progress: Progress): Promise<channels.ArtifactStreamResult>;
    failure(params: channels.ArtifactFailureParams, progress: Progress): Promise<channels.ArtifactFailureResult>;
    cancel(params: channels.ArtifactCancelParams, progress: Progress): Promise<void>;
    delete(params: channels.ArtifactDeleteParams, progress: Progress): Promise<void>;
}
