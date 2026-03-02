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

import { AndroidServerLauncherImpl } from './androidServerImpl';
import { BrowserServerLauncherImpl } from './browserServerImpl';
import { DispatcherConnection, copilotbrowserDispatcher, RootDispatcher, createcopilotbrowser } from './server';
import { nodePlatform } from './server/utils/nodePlatform';
import { Connection } from './client/connection';

import type { copilotbrowser as copilotbrowserAPI } from './client/copilotbrowser';
import type { Language } from './utils';

export function createInProcesscopilotbrowser(): copilotbrowserAPI {
  const copilotbrowser = createcopilotbrowser({ sdkLanguage: (process.env.PW_LANG_NAME as Language | undefined) || 'javascript' });
  const clientConnection = new Connection(nodePlatform);
  clientConnection.useRawBuffers();
  const dispatcherConnection = new DispatcherConnection(true /* local */);

  // Dispatch synchronously at first.
  dispatcherConnection.onmessage = message => clientConnection.dispatch(message);
  clientConnection.onmessage = message => dispatcherConnection.dispatch(message);

  const rootScope = new RootDispatcher(dispatcherConnection);

  // Initialize copilotbrowser channel.
  new copilotbrowserDispatcher(rootScope, copilotbrowser);
  const copilotbrowserAPI = clientConnection.getObjectWithKnownName('copilotbrowser') as copilotbrowserAPI;
  copilotbrowserAPI.chromium._serverLauncher = new BrowserServerLauncherImpl('chromium');
  copilotbrowserAPI.firefox._serverLauncher = new BrowserServerLauncherImpl('firefox');
  copilotbrowserAPI.webkit._serverLauncher = new BrowserServerLauncherImpl('webkit');
  copilotbrowserAPI._android._serverLauncher = new AndroidServerLauncherImpl();

  // Switch to async dispatch after we got copilotbrowser object.
  dispatcherConnection.onmessage = message => setImmediate(() => clientConnection.dispatch(message));
  clientConnection.onmessage = message => setImmediate(() => dispatcherConnection.dispatch(message));

  clientConnection.toImpl = x => {
    if (x instanceof Connection)
      return x === clientConnection ? dispatcherConnection : undefined;
    if (!x)
      return dispatcherConnection._dispatcherByGuid.get('');
    return dispatcherConnection._dispatcherByGuid.get(x._guid)!._object;
  };
  return copilotbrowserAPI;
}
