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

// copilotbrowser is bundled inside this package (bundledDependencies), so
// these requires resolve to our own node_modules even without a separate install.
const { isLikelyNpxGlobal } = require('@copilotbrowser/copilotbrowser/lib/utils');
const { installBrowsersForNpmInstall } = require('@copilotbrowser/copilotbrowser/lib/server');

// Install all browser engines. Individual browser packages (copilotbrowser-chromium,
// copilotbrowser-firefox, copilotbrowser-webkit) are no longer needed.
if (!isLikelyNpxGlobal())
  installBrowsersForNpmInstall(['chromium', 'chromium-headless-shell', 'ffmpeg', 'firefox', 'webkit']);
