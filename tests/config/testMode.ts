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

import { start } from '../../packages/copilotbrowser/lib/outofprocess';
import type { copilotbrowser } from '../../packages/copilotbrowser/lib/client/copilotbrowser';

export type TestModeName = 'default' | 'driver' | 'service' | 'service2' | 'wsl';

interface TestMode {
  setup(): Promise<copilotbrowser>;
  teardown(): Promise<void>;
}

export class DriverTestMode implements TestMode {
  private _impl: { copilotbrowser: copilotbrowser; stop: () => Promise<void>; };

  async setup() {
    this._impl = await start({
      NODE_OPTIONS: undefined,  // Hide driver process while debugging.
    });
    return this._impl.copilotbrowser;
  }

  async teardown() {
    await this._impl.stop();
  }
}

export class DefaultTestMode implements TestMode {
  async setup() {
    return require('copilotbrowser');
  }

  async teardown() {
  }
}
