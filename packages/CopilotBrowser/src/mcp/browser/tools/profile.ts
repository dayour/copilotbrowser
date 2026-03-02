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

import fs from 'fs';
import path from 'path';

import { z } from 'copilotbrowser-core/lib/mcpBundle';
import { defineTool } from './tool';

const listProfiles = defineTool({
  capability: 'core',

  schema: {
    name: 'browser_list_profiles',
    title: 'List browser profiles',
    description: 'List available browser profiles in the user data directory. Only works with Chromium-based browsers (Chrome, Edge) when a user data directory is configured.',
    inputSchema: z.object({}),
    type: 'readOnly',
  },

  handle: async (context, _params, response) => {
    const config = context.config;
    if (config.browser.browserName !== 'chromium') {
      response.addTextResult('Profile listing is only supported for Chromium-based browsers (Chrome, Edge).');
      return;
    }

    const userDataDir = config.browser.userDataDir;
    if (!userDataDir) {
      response.addTextResult('No user data directory configured. Use --user-data-dir to specify one, or run without --isolated.');
      return;
    }

    const localStatePath = path.join(userDataDir, 'Local State');
    let profiles: { directory: string; name: string; email: string }[] = [];

    try {
      const localState = JSON.parse(await fs.promises.readFile(localStatePath, 'utf8'));
      const infoCache = localState?.profile?.info_cache;
      if (infoCache) {
        for (const [dir, info] of Object.entries<any>(infoCache)) {
          profiles.push({
            directory: dir,
            name: info.name || dir,
            email: info.user_name || '',
          });
        }
      }
    } catch {
      // Fall back to directory listing
      try {
        const entries = await fs.promises.readdir(userDataDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory())
            continue;
          if (entry.name === 'Default' || entry.name.startsWith('Profile ')) {
            const prefsPath = path.join(userDataDir, entry.name, 'Preferences');
            let name = entry.name;
            try {
              const prefs = JSON.parse(await fs.promises.readFile(prefsPath, 'utf8'));
              name = prefs?.profile?.name || entry.name;
            } catch { /* ignore */ }
            profiles.push({ directory: entry.name, name, email: '' });
          }
        }
      } catch {
        response.addTextResult(`Could not read user data directory: ${userDataDir}`);
        return;
      }
    }

    if (profiles.length === 0) {
      response.addTextResult(`No profiles found in ${userDataDir}`);
      return;
    }

    const current = config.browser.profileDirectory || 'Default';
    const lines = profiles.map(p => {
      const marker = p.directory === current ? ' (active)' : '';
      const emailPart = p.email ? ` <${p.email}>` : '';
      return `- ${p.directory}: ${p.name}${emailPart}${marker}`;
    });
    response.addTextResult(`Profiles in ${userDataDir}:\n${lines.join('\n')}`);
  },
});

const switchProfile = defineTool({
  capability: 'core',

  schema: {
    name: 'browser_switch_profile',
    title: 'Switch browser profile',
    description: 'Switch to a different browser profile directory (e.g. "Default", "Profile 1", "Profile 2"). Closes the current browser and reopens with the new profile. Only works with Chromium-based browsers (Chrome, Edge) when a user data directory is configured. Use browser_list_profiles to see available profiles.',
    inputSchema: z.object({
      profile: z.string().describe('Profile directory name to switch to (e.g. "Default", "Profile 1", "Profile 2")'),
    }),
    type: 'action',
  },

  handle: async (context, params, response) => {
    const config = context.config;
    if (config.browser.browserName !== 'chromium') {
      response.addTextResult('Profile switching is only supported for Chromium-based browsers (Chrome, Edge).');
      return;
    }

    if (config.browser.isolated) {
      response.addTextResult('Profile switching is not available in isolated mode. Restart without --isolated and with --user-data-dir to use profiles.');
      return;
    }

    const userDataDir = config.browser.userDataDir;
    if (!userDataDir) {
      response.addTextResult('No user data directory configured. Use --user-data-dir to specify one.');
      return;
    }

    const profileDir = path.join(userDataDir, params.profile);
    try {
      await fs.promises.access(profileDir);
    } catch {
      response.addTextResult(`Profile directory "${params.profile}" does not exist in ${userDataDir}. Use browser_list_profiles to see available profiles.`);
      return;
    }

    const previous = config.browser.profileDirectory || 'Default';
    // Close the current browser context
    await context.closeBrowserContext();

    // Update the profile directory in the config — next browser launch will use it
    config.browser.profileDirectory = params.profile;

    response.addTextResult(`Switched from profile "${previous}" to "${params.profile}". The browser will use the new profile on the next action.`);
  },
});

export default [
  listProfiles,
  switchProfile,
];
