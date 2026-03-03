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

import { SocksProxy } from '../utils/socksProxy';
import { GlobalAPIRequestContext } from '../fetch';
import { AndroidDispatcher } from './androidDispatcher';
import { AndroidDeviceDispatcher } from './androidDispatcher';
import { BrowserDispatcher } from './browserDispatcher';
import { BrowserTypeDispatcher } from './browserTypeDispatcher';
import { Dispatcher } from './dispatcher';
import { ElectronDispatcher } from './electronDispatcher';
import { LocalUtilsDispatcher } from './localUtilsDispatcher';
import { APIRequestContextDispatcher } from './networkDispatchers';
import { SdkObject } from '../instrumentation';
import { eventsHelper  } from '../utils/eventsHelper';

import type { RootDispatcher } from './dispatcher';
import type { SocksSocketClosedPayload, SocksSocketDataPayload, SocksSocketRequestedPayload } from '../utils/socksProxy';
import type { RegisteredListener } from '../utils/eventsHelper';
import type { AndroidDevice } from '../android/android';
import type { Browser } from '../browser';
import type { copilotbrowser } from '../copilotbrowser';
import type * as channels from '@protocol/channels';
import type { Progress } from '@protocol/progress';

export type copilotbrowserDispatcherOptions = {
  socksProxy?: SocksProxy;
  denyLaunch?: boolean;
  preLaunchedBrowser?: Browser;
  preLaunchedAndroidDevice?: AndroidDevice;
  sharedBrowser?: boolean;
};

export class copilotbrowserDispatcher extends Dispatcher<copilotbrowser, channels.copilotbrowserChannel, RootDispatcher> implements channels.copilotbrowserChannel {
  _type_copilotbrowser;
  private _browserDispatcher: BrowserDispatcher | undefined;

  constructor(scope: RootDispatcher, copilotbrowser: copilotbrowser, options: copilotbrowserDispatcherOptions = {}) {
    const denyLaunch = options.denyLaunch ?? false;
    const chromium = new BrowserTypeDispatcher(scope, copilotbrowser.chromium, denyLaunch);
    const firefox = new BrowserTypeDispatcher(scope, copilotbrowser.firefox, denyLaunch);
    const webkit = new BrowserTypeDispatcher(scope, copilotbrowser.webkit, denyLaunch);
    const android = new AndroidDispatcher(scope, copilotbrowser.android);
    const initializer: channels.copilotbrowserInitializer = {
      chromium,
      firefox,
      webkit,
      android,
      electron: new ElectronDispatcher(scope, copilotbrowser.electron, denyLaunch),
      utils: copilotbrowser.options.isServer ? undefined : new LocalUtilsDispatcher(scope, copilotbrowser),
      socksSupport: options.socksProxy ? new SocksSupportDispatcher(scope, copilotbrowser, options.socksProxy) : undefined,
    };

    let browserDispatcher: BrowserDispatcher | undefined;
    if (options.preLaunchedBrowser) {
      const browserTypeDispatcher = initializer[options.preLaunchedBrowser.options.name as keyof typeof initializer] as BrowserTypeDispatcher;
      browserDispatcher = new BrowserDispatcher(browserTypeDispatcher, options.preLaunchedBrowser, {
        ignoreStopAndKill: true,
        isolateContexts: !options.sharedBrowser,
      });
      initializer.preLaunchedBrowser = browserDispatcher;
    }

    if (options.preLaunchedAndroidDevice)
      initializer.preConnectedAndroidDevice = new AndroidDeviceDispatcher(android, options.preLaunchedAndroidDevice);

    super(scope, copilotbrowser, 'copilotbrowser', initializer);
    this._type_copilotbrowser = true;
    this._browserDispatcher = browserDispatcher;
  }

  async newRequest(params: channels.copilotbrowserNewRequestParams, progress: Progress): Promise<channels.copilotbrowserNewRequestResult> {
    const request = new GlobalAPIRequestContext(this._object, params);
    return { request: APIRequestContextDispatcher.from(this.parentScope(), request) };
  }

  async cleanup() {
    // Cleanup contexts upon disconnect.
    await this._browserDispatcher?.cleanupContexts();
  }
}

class SocksSupportDispatcher extends Dispatcher<SdkObject, channels.SocksSupportChannel, RootDispatcher> implements channels.SocksSupportChannel {
  _type_SocksSupport: boolean;
  private _socksProxy: SocksProxy;
  private _socksListeners: RegisteredListener[];

  constructor(scope: RootDispatcher, parent: SdkObject, socksProxy: SocksProxy) {
    super(scope, new SdkObject(parent, 'socksSupport'), 'SocksSupport', {});
    this._type_SocksSupport = true;
    this._socksProxy = socksProxy;
    this._socksListeners = [
      eventsHelper.addEventListener(socksProxy, SocksProxy.Events.SocksRequested, (payload: SocksSocketRequestedPayload) => this._dispatchEvent('socksRequested', payload)),
      eventsHelper.addEventListener(socksProxy, SocksProxy.Events.SocksData, (payload: SocksSocketDataPayload) => this._dispatchEvent('socksData', payload)),
      eventsHelper.addEventListener(socksProxy, SocksProxy.Events.SocksClosed, (payload: SocksSocketClosedPayload) => this._dispatchEvent('socksClosed', payload)),
    ];
  }

  async socksConnected(params: channels.SocksSupportSocksConnectedParams, progress: Progress): Promise<void> {
    this._socksProxy?.socketConnected(params);
  }

  async socksFailed(params: channels.SocksSupportSocksFailedParams, progress: Progress): Promise<void> {
    this._socksProxy?.socketFailed(params);
  }

  async socksData(params: channels.SocksSupportSocksDataParams, progress: Progress): Promise<void> {
    this._socksProxy?.sendSocketData(params);
  }

  async socksError(params: channels.SocksSupportSocksErrorParams, progress: Progress): Promise<void> {
    this._socksProxy?.sendSocketError(params);
  }

  async socksEnd(params: channels.SocksSupportSocksEndParams, progress: Progress): Promise<void> {
    this._socksProxy?.sendSocketEnd(params);
  }

  override _onDispose() {
    eventsHelper.removeEventListeners(this._socksListeners);
  }
}
