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

import crypto from 'crypto';
import fs from 'fs';
import net from 'net';
import path from 'path';

import * as copilotbrowser from 'copilotbrowser-core';
import { registryDirectory } from 'copilotbrowser-core/lib/server/registry/index';
import { startTraceViewerServer } from 'copilotbrowser-core/lib/server';
import { logUnhandledError, testDebug } from '../log';
import { outputDir, outputFile } from './config';
import { firstRootPath } from '../sdk/server';

import type { FullConfig } from './config';
import type { LaunchOptions, BrowserContextOptions } from '../../../../copilotbrowser-core/src/client/types';
import type { ClientInfo } from '../sdk/server';

export function contextFactory(config: FullConfig): BrowserContextFactory {
  if (config.sharedBrowserContext)
    return SharedContextFactory.create(config);
  if (config.browser.remoteEndpoint)
    return new RemoteContextFactory(config);
  if (config.browser.cdpEndpoint)
    return new CdpContextFactory(config);
  if (config.browser.isolated)
    return new IsolatedContextFactory(config);
  return new PersistentContextFactory(config);
}

export type BrowserContextFactoryResult = {
  browserContext: copilotbrowser.BrowserContext;
  close: () => Promise<void>;
};

type CreateContextOptions = {
  toolName?: string;
};

export interface BrowserContextFactory {
  createContext(clientInfo: ClientInfo, abortSignal: AbortSignal, options: CreateContextOptions): Promise<BrowserContextFactoryResult>;
}

export function identityBrowserContextFactory(browserContext: copilotbrowser.BrowserContext): BrowserContextFactory {
  return {
    createContext: async (clientInfo: ClientInfo, abortSignal: AbortSignal, options: CreateContextOptions) => {
      return {
        browserContext,
        close: async () => {}
      };
    }
  };
}

class BaseContextFactory implements BrowserContextFactory {
  readonly config: FullConfig;
  private _logName: string;
  protected _browserPromise: Promise<copilotbrowser.Browser> | undefined;

  constructor(name: string, config: FullConfig) {
    this._logName = name;
    this.config = config;
  }

  protected async _obtainBrowser(clientInfo: ClientInfo, options: CreateContextOptions): Promise<copilotbrowser.Browser> {
    if (this._browserPromise)
      return this._browserPromise;
    testDebug(`obtain browser (${this._logName})`);
    this._browserPromise = this._doObtainBrowser(clientInfo, options);
    void this._browserPromise.then(browser => {
      browser.on('disconnected', () => {
        this._browserPromise = undefined;
      });
    }).catch(() => {
      this._browserPromise = undefined;
    });
    return this._browserPromise;
  }

  protected async _doObtainBrowser(clientInfo: ClientInfo, options: CreateContextOptions): Promise<copilotbrowser.Browser> {
    throw new Error('Not implemented');
  }

  async createContext(clientInfo: ClientInfo, _: AbortSignal, options: CreateContextOptions): Promise<BrowserContextFactoryResult> {
    testDebug(`create browser context (${this._logName})`);
    const browser = await this._obtainBrowser(clientInfo, options);
    const browserContext = await this._doCreateContext(browser, clientInfo);
    await addInitScript(browserContext, this.config.browser.initScript);
    return {
      browserContext,
      close: () => this._closeBrowserContext(browserContext, browser)
    };
  }

  protected async _doCreateContext(browser: copilotbrowser.Browser, clientInfo: ClientInfo): Promise<copilotbrowser.BrowserContext> {
    throw new Error('Not implemented');
  }

  private async _closeBrowserContext(browserContext: copilotbrowser.BrowserContext, browser: copilotbrowser.Browser) {
    testDebug(`close browser context (${this._logName})`);
    if (browser.contexts().length === 1)
      this._browserPromise = undefined;
    await browserContext.close().catch(logUnhandledError);
    if (browser.contexts().length === 0) {
      testDebug(`close browser (${this._logName})`);
      await browser.close().catch(logUnhandledError);
    }
  }
}

class IsolatedContextFactory extends BaseContextFactory {
  constructor(config: FullConfig) {
    super('isolated', config);
  }

  protected override async _doObtainBrowser(clientInfo: ClientInfo, options: CreateContextOptions): Promise<copilotbrowser.Browser> {
    await injectCdpPort(this.config.browser);
    const browserType = copilotbrowser[this.config.browser.browserName];
    const tracesDir = await computeTracesDir(this.config, clientInfo);
    if (tracesDir && this.config.saveTrace)
      await startTraceServer(this.config, tracesDir);
    return browserType.launch({
      tracesDir,
      ...this.config.browser.launchOptions,
      handleSIGINT: false,
      handleSIGTERM: false,
    }).catch(error => {
      if (error.message.includes('Executable doesn\'t exist'))
        throwBrowserIsNotInstalledError(this.config);
      throw error;
    });
  }

  protected override async _doCreateContext(browser: copilotbrowser.Browser, clientInfo: ClientInfo): Promise<copilotbrowser.BrowserContext> {
    return browser.newContext(await browserContextOptionsFromConfig(this.config, clientInfo));
  }
}

class CdpContextFactory extends BaseContextFactory {
  constructor(config: FullConfig) {
    super('cdp', config);
  }

  protected override async _doObtainBrowser(): Promise<copilotbrowser.Browser> {
    return copilotbrowser.chromium.connectOverCDP(this.config.browser.cdpEndpoint!, {
      headers: this.config.browser.cdpHeaders,
      timeout: this.config.browser.cdpTimeout
    });
  }

  protected override async _doCreateContext(browser: copilotbrowser.Browser): Promise<copilotbrowser.BrowserContext> {
    return this.config.browser.isolated ? await browser.newContext() : browser.contexts()[0];
  }
}

class RemoteContextFactory extends BaseContextFactory {
  constructor(config: FullConfig) {
    super('remote', config);
  }

  protected override async _doObtainBrowser(): Promise<copilotbrowser.Browser> {
    const url = new URL(this.config.browser.remoteEndpoint!);
    url.searchParams.set('browser', this.config.browser.browserName);
    if (this.config.browser.launchOptions)
      url.searchParams.set('launch-options', JSON.stringify(this.config.browser.launchOptions));
    return copilotbrowser[this.config.browser.browserName].connect(String(url));
  }

  protected override async _doCreateContext(browser: copilotbrowser.Browser): Promise<copilotbrowser.BrowserContext> {
    return browser.newContext();
  }
}

class PersistentContextFactory implements BrowserContextFactory {
  readonly config: FullConfig;
  readonly name = 'persistent';
  readonly description = 'Create a new persistent browser context';

  private _userDataDirs = new Set<string>();

  constructor(config: FullConfig) {
    this.config = config;
  }

  async createContext(clientInfo: ClientInfo, abortSignal: AbortSignal, options: CreateContextOptions): Promise<BrowserContextFactoryResult> {
    await injectCdpPort(this.config.browser);
    testDebug('create browser context (persistent)');
    const userDataDir = this.config.browser.userDataDir ?? await this._createUserDataDir(clientInfo);
    const tracesDir = await computeTracesDir(this.config, clientInfo);
    if (tracesDir && this.config.saveTrace)
      await startTraceServer(this.config, tracesDir);

    this._userDataDirs.add(userDataDir);
    testDebug('lock user data dir', userDataDir);

    const browserType = copilotbrowser[this.config.browser.browserName];
    for (let i = 0; i < 5; i++) {
      const launchOptions: LaunchOptions & BrowserContextOptions = {
        tracesDir,
        ...this.config.browser.launchOptions,
        ...await browserContextOptionsFromConfig(this.config, clientInfo),
        handleSIGINT: false,
        handleSIGTERM: false,
        ignoreDefaultArgs: [
          '--disable-extensions',
        ],
        assistantMode: true,
      };
      try {
        const browserContext = await browserType.launchPersistentContext(userDataDir, launchOptions);
        await addInitScript(browserContext, this.config.browser.initScript);
        const close = () => this._closeBrowserContext(browserContext, userDataDir);
        return { browserContext, close };
      } catch (error: any) {
        if (error.message.includes('Executable doesn\'t exist'))
          throwBrowserIsNotInstalledError(this.config);
        if (error.message.includes('cannot open shared object file: No such file or directory')) {
          const browserName = launchOptions.channel ?? this.config.browser.browserName;
          throw new Error(`Missing system dependencies required to run browser ${browserName}. Install them with: sudo npx copilotbrowser install-deps ${browserName}`);
        }
        if (error.message.includes('ProcessSingleton') ||
            // On Windows the process exits silently with code 21 when the profile is in use.
            error.message.includes('exitCode=21')) {
          // User data directory is already in use, try again.
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        if (error.message.includes('exitCode=0') && error.message.includes('Opening in existing browser session')) {
          // Edge joined an existing session instead of launching a new one. Kill existing
          // Edge processes using the same user-data-dir and retry.
          await killEdgeProcessesForUserDataDir(userDataDir);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        throw error;
      }
    }
    throw new Error(`Browser is already in use for ${userDataDir}, use --isolated to run multiple instances of the same browser`);
  }

  private async _closeBrowserContext(browserContext: copilotbrowser.BrowserContext, userDataDir: string) {
    testDebug('close browser context (persistent)');
    testDebug('release user data dir', userDataDir);
    await browserContext.close().catch(() => {});
    this._userDataDirs.delete(userDataDir);
    if (process.env.PWMCP_PROFILES_DIR_FOR_TEST && userDataDir.startsWith(process.env.PWMCP_PROFILES_DIR_FOR_TEST))
      await fs.promises.rm(userDataDir, { recursive: true }).catch(logUnhandledError);
    testDebug('close browser context complete (persistent)');
  }

  private async _createUserDataDir(clientInfo: ClientInfo) {
    const dir = process.env.PWMCP_PROFILES_DIR_FOR_TEST ?? registryDirectory;
    const browserToken = this.config.browser.launchOptions?.channel ?? this.config.browser?.browserName;
    // Hesitant putting hundreds of files into the user's workspace, so using it for hashing instead.
    const rootPath = firstRootPath(clientInfo);
    const rootPathToken = rootPath ? `-${createHash(rootPath)}` : '';
    const result = path.join(dir, `mcp-${browserToken}${rootPathToken}`);
    await fs.promises.mkdir(result, { recursive: true });
    return result;
  }
}

async function injectCdpPort(browserConfig: FullConfig['browser']) {
  if (browserConfig.browserName === 'chromium')
    (browserConfig.launchOptions as any).cdpPort = await findFreePort();
}

async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
    server.on('error', reject);
  });
}

async function startTraceServer(config: FullConfig, tracesDir: string): Promise<string | undefined> {
  if (!config.saveTrace)
    return;

  const server = await startTraceViewerServer();
  const urlPrefix = server.urlPrefix('human-readable');
  const url = urlPrefix + '/trace/index.html?trace=' + tracesDir + '/trace.json';
  // eslint-disable-next-line no-console
  console.error('\nTrace viewer listening on ' + url);
}

function createHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 7);
}

async function addInitScript(browserContext: copilotbrowser.BrowserContext, initScript: string[] | undefined) {
  for (const scriptPath of initScript ?? [])
    await browserContext.addInitScript({ path: path.resolve(scriptPath) });
}

async function killEdgeProcessesForUserDataDir(userDataDir: string) {
  // Kill Edge/Chromium processes that hold a lock on the given user-data-dir.
  try {
    const { execSync } = require('child_process') as typeof import('child_process');
    const normalizedDir = path.normalize(userDataDir);
    if (process.platform === 'win32') {
      const output = execSync('wmic process where "name like \'%msedge%\' or name like \'%chrome%\'" get ProcessId,CommandLine /format:csv', { encoding: 'utf-8', timeout: 5000 }).toString();
      for (const line of output.split('\n')) {
        if (line.includes(normalizedDir)) {
          const parts = line.trim().split(',');
          const pid = parseInt(parts[parts.length - 1], 10);
          if (pid)
            process.kill(pid);
        }
      }
    } else {
      execSync(`pkill -f "${normalizedDir.replace(/"/g, '\\"')}" || true`, { timeout: 5000 });
    }
  } catch {
    // Best-effort: if we can't kill the processes, the retry will still attempt to launch.
  }
}

export class SharedContextFactory implements BrowserContextFactory {
  private _contextPromise: Promise<BrowserContextFactoryResult> | undefined;
  private _baseFactory: BrowserContextFactory;
  private static _instance: SharedContextFactory | undefined;

  static create(config: FullConfig) {
    if (SharedContextFactory._instance)
      throw new Error('SharedContextFactory already exists');
    const baseConfig = { ...config, sharedBrowserContext: false };
    const baseFactory = contextFactory(baseConfig);
    SharedContextFactory._instance = new SharedContextFactory(baseFactory);
    return SharedContextFactory._instance;
  }

  private constructor(baseFactory: BrowserContextFactory) {
    this._baseFactory = baseFactory;
  }

  async createContext(clientInfo: ClientInfo, abortSignal: AbortSignal, options: { toolName?: string }): Promise<{ browserContext: copilotbrowser.BrowserContext, close: () => Promise<void> }> {
    if (!this._contextPromise) {
      testDebug('create shared browser context');
      this._contextPromise = this._baseFactory.createContext(clientInfo, abortSignal, options);
    }

    const { browserContext } = await this._contextPromise;
    testDebug(`shared context client connected`);
    return {
      browserContext,
      close: async () => {
        testDebug(`shared context client disconnected`);
      },
    };
  }

  static async dispose() {
    await SharedContextFactory._instance?._dispose();
  }

  private async _dispose() {
    const contextPromise = this._contextPromise;
    this._contextPromise = undefined;
    if (!contextPromise)
      return;
    const { close } = await contextPromise;
    await close();
  }
}

async function computeTracesDir(config: FullConfig, clientInfo: ClientInfo): Promise<string | undefined> {
  return path.resolve(outputDir(config, clientInfo), 'traces');
}

async function browserContextOptionsFromConfig(config: FullConfig, clientInfo: ClientInfo): Promise<copilotbrowser.BrowserContextOptions> {
  const result = { ...config.browser.contextOptions };
  if (config.saveVideo) {
    const dir = await outputFile(config, clientInfo, `videos`, { origin: 'code' });
    result.recordVideo = {
      dir,
      size: config.saveVideo,
    };
  }
  return result;
}

function throwBrowserIsNotInstalledError(config: FullConfig): never {
  const channel = config.browser.launchOptions?.channel ?? config.browser.browserName;
  if (config.skillMode)
    throw new Error(`Browser "${channel}" is not installed. Run \`copilotbrowser-cli install-browser ${channel}\` to install`);
  else
    throw new Error(`Browser "${channel}" is not installed. Either install it (likely) or change the config.`);
}
