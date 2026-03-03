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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchApp = launchApp;
exports.syncLocalStorageWithSettings = syncLocalStorageWithSettings;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../utils");
const registry_1 = require("./registry");
const registry_2 = require("./registry");
const progress_1 = require("./progress");
async function launchApp(browserType, options) {
    const args = [...options.persistentContextOptions?.args ?? []];
    let channel = options.persistentContextOptions?.channel;
    if (browserType.name() === 'chromium') {
        args.push('--app=data:text/html,', `--window-size=${options.windowSize.width},${options.windowSize.height}`, ...(options.windowPosition ? [`--window-position=${options.windowPosition.x},${options.windowPosition.y}`] : []), '--test-type=');
        if (!channel && !options.persistentContextOptions?.executablePath)
            channel = (0, registry_1.findChromiumChannelBestEffort)(options.sdkLanguage);
    }
    const controller = new progress_1.ProgressController();
    let context;
    try {
        context = await controller.run(progress => browserType.launchPersistentContext(progress, '', {
            ignoreDefaultArgs: ['--enable-automation'],
            ...options?.persistentContextOptions,
            channel,
            noDefaultViewport: options.persistentContextOptions?.noDefaultViewport ?? true,
            acceptDownloads: options?.persistentContextOptions?.acceptDownloads ?? ((0, utils_1.isUnderTest)() ? 'accept' : 'internal-browser-default'),
            colorScheme: options?.persistentContextOptions?.colorScheme ?? 'no-override',
            args,
        }), 0); // Deliberately no timeout for our apps.
    }
    catch (error) {
        if (channel) {
            error = (0, utils_1.rewriteErrorMessage)(error, [
                `Failed to launch "${channel}" channel.`,
                'Using custom channels could lead to unexpected behavior due to Enterprise policies (chrome://policy).',
                'Install the default browser instead:',
                (0, utils_1.wrapInASCIIBox)(`${(0, registry_1.buildcopilotbrowserCLICommand)(options.sdkLanguage, 'install')}`, 2),
            ].join('\n'));
        }
        throw error;
    }
    const [page] = context.pages();
    // Chromium on macOS opens a new tab when clicking on the dock icon.
    // See https://github.com/dayour/copilotbrowser/issues/9434
    if (browserType.name() === 'chromium' && process.platform === 'darwin') {
        context.on('page', async (newPage) => {
            if (newPage.mainFrame().url() === 'chrome://new-tab-page/') {
                await page.bringToFront();
                await newPage.close();
            }
        });
    }
    if (browserType.name() === 'chromium')
        await installAppIcon(page);
    return { context, page };
}
async function installAppIcon(page) {
    const icon = await fs_1.default.promises.readFile(require.resolve('./chromium/appIcon.png'));
    const crPage = page.delegate;
    await crPage._mainFrameSession._client.send('Browser.setDockTile', {
        image: icon.toString('base64')
    });
}
async function syncLocalStorageWithSettings(page, appName) {
    if ((0, utils_1.isUnderTest)())
        return;
    const settingsFile = path_1.default.join(registry_2.registryDirectory, '.settings', `${appName}.json`);
    const controller = new progress_1.ProgressController();
    await controller.run(async (progress) => {
        await page.exposeBinding(progress, '_saveSerializedSettings', false, (_, settings) => {
            fs_1.default.mkdirSync(path_1.default.dirname(settingsFile), { recursive: true });
            fs_1.default.writeFileSync(settingsFile, settings);
        });
        const settings = await fs_1.default.promises.readFile(settingsFile, 'utf-8').catch(() => ('{}'));
        await page.addInitScript(progress, `(${String((settings) => {
            // iframes w/ snapshots, etc.
            if (location && location.protocol === 'data:')
                return;
            if (window.top !== window)
                return;
            Object.entries(settings).map(([k, v]) => localStorage[k] = v);
            window.saveSettings = () => {
                window._saveSerializedSettings(JSON.stringify({ ...localStorage }));
            };
        })})(${settings});
    `);
    });
}
