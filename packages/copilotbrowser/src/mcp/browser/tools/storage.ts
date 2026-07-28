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

import { z } from '@copilotbrowser/copilotbrowser/lib/mcpBundle';
import { defineTool } from './tool';

const kSavedSessionsDir = '.copilotbrowser/sessions';

type SavedSessionMetadata = {
  name: string;
  description?: string;
  createdAt: string;
  includeIndexedDB: boolean;
  storageStateFile: string;
};

function sessionSlug(name: string): string {
  return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'session';
}

async function ensureSavedSessionsDir(context: Parameters<typeof storageState.handle>[0]): Promise<string> {
  const dir = await context.workspaceFile(kSavedSessionsDir, undefined);
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}

function sessionFiles(dir: string, name: string) {
  const slug = sessionSlug(name);
  return {
    slug,
    stateFile: path.join(dir, `${slug}.json`),
    metaFile: path.join(dir, `${slug}.meta.json`),
  };
}

async function readSessionMetadata(metaFile: string): Promise<SavedSessionMetadata | undefined> {
  try {
    return JSON.parse(await fs.promises.readFile(metaFile, 'utf-8')) as SavedSessionMetadata;
  } catch {
    return undefined;
  }
}

const storageState = defineTool({
  capability: 'storage',

  schema: {
    name: 'browser_storage_state',
    title: 'Save storage state',
    description: 'Save storage state (cookies, local storage) to a file for later reuse',
    inputSchema: z.object({
      filename: z.string().optional().describe('File name to save the storage state to. Defaults to `storage-state-{timestamp}.json` if not specified.'),
      includeIndexedDB: z.boolean().default(false).describe('Whether to include IndexedDB contents. Useful for auth providers that persist tokens there.'),
    }),
    type: 'readOnly',
  },

  handle: async (context, params, response) => {
    const browserContext = await context.ensureBrowserContext();
    const state = await browserContext.storageState({ indexedDB: params.includeIndexedDB });
    const serializedState = JSON.stringify(state, null, 2);
    const resolvedFile = await response.resolveClientFile({ prefix: 'storage-state', ext: 'json', suggestedFilename: params.filename }, 'Storage state');
    await fs.promises.mkdir(path.dirname(resolvedFile.fileName), { recursive: true });
    response.addCode(`await page.context().storageState({ path: '${resolvedFile.relativeName}' });`);
    await response.addFileResult(resolvedFile, serializedState);
  },
});

const setStorageState = defineTool({
  capability: 'storage',

  schema: {
    name: 'browser_set_storage_state',
    title: 'Restore storage state',
    description: 'Restore storage state (cookies, local storage) from a file. This clears existing cookies and local storage before restoring.',
    inputSchema: z.object({
      filename: z.string().describe('Path to the storage state file to restore from'),
    }),
    type: 'action',
  },

  handle: async (context, params, response) => {
    const browserContext = await context.ensureBrowserContext();
    await browserContext.setStorageState(params.filename);
    response.addTextResult(`Storage state restored from ${params.filename}`);
    response.addCode(`await page.context().setStorageState('${params.filename}');`);
  },
});

export default [
  storageState,
  setStorageState,
  defineTool({
    capability: 'storage',

    schema: {
      name: 'browser_session_save',
      title: 'Save named browser session',
      description: 'Persist the current browser storage as a named reusable session inside the workspace.',
      inputSchema: z.object({
        name: z.string().describe('Session name to save, for example `signed-in-admin`'),
        description: z.string().optional().describe('Optional description for the saved session.'),
        includeIndexedDB: z.boolean().default(true).describe('Whether to include IndexedDB when capturing the session.'),
      }),
      type: 'action',
    },

    handle: async (context, params, response) => {
      const browserContext = await context.ensureBrowserContext();
      const dir = await ensureSavedSessionsDir(context);
      const { slug, stateFile, metaFile } = sessionFiles(dir, params.name);
      const state = await browserContext.storageState({ indexedDB: params.includeIndexedDB });
      const metadata: SavedSessionMetadata = {
        name: params.name,
        description: params.description,
        createdAt: new Date().toISOString(),
        includeIndexedDB: params.includeIndexedDB,
        storageStateFile: path.basename(stateFile),
      };
      await fs.promises.writeFile(stateFile, JSON.stringify(state, null, 2), 'utf-8');
      await fs.promises.writeFile(metaFile, JSON.stringify(metadata, null, 2), 'utf-8');
      response.addTextResult(`Saved session "${params.name}" as ${path.posix.join(kSavedSessionsDir, `${slug}.json`)}`);
      response.addCode(`await page.context().storageState({ path: '${path.posix.join(kSavedSessionsDir, `${slug}.json`)}' });`);
    },
  }),
  defineTool({
    capability: 'storage',

    schema: {
      name: 'browser_session_list',
      title: 'List saved browser sessions',
      description: 'List named sessions saved in the workspace.',
      inputSchema: z.object({}),
      type: 'readOnly',
    },

    handle: async (context, params, response) => {
      const dir = await ensureSavedSessionsDir(context);
      const files = await fs.promises.readdir(dir).catch(() => []);
      const metaFiles = files.filter(file => file.endsWith('.meta.json')).sort();
      if (!metaFiles.length) {
        response.addTextResult('No saved sessions found.');
        return;
      }

      const lines: string[] = [];
      for (const file of metaFiles) {
        const meta = await readSessionMetadata(path.join(dir, file));
        if (!meta)
          continue;
        const description = meta.description ? ` - ${meta.description}` : '';
        const indexedDB = meta.includeIndexedDB ? ' with IndexedDB' : '';
        lines.push(`- ${meta.name}${description} (${meta.createdAt}${indexedDB})`);
      }
      response.addTextResult(lines.join('\n'));
    },
  }),
  defineTool({
    capability: 'storage',

    schema: {
      name: 'browser_session_restore',
      title: 'Restore named browser session',
      description: 'Restore a previously saved named session into the current browser context.',
      inputSchema: z.object({
        name: z.string().describe('Saved session name to restore.'),
      }),
      type: 'action',
    },

    handle: async (context, params, response) => {
      const browserContext = await context.ensureBrowserContext();
      const dir = await ensureSavedSessionsDir(context);
      const { stateFile } = sessionFiles(dir, params.name);
      await fs.promises.access(stateFile);
      await browserContext.setStorageState(stateFile);
      response.addTextResult(`Restored session "${params.name}"`);
      response.addCode(`await page.context().setStorageState('${path.posix.join(kSavedSessionsDir, `${sessionSlug(params.name)}.json`)}');`);
    },
  }),
  defineTool({
    capability: 'storage',

    schema: {
      name: 'browser_session_delete',
      title: 'Delete named browser session',
      description: 'Delete a saved named session from the workspace.',
      inputSchema: z.object({
        name: z.string().describe('Saved session name to delete.'),
      }),
      type: 'action',
    },

    handle: async (context, params, response) => {
      const dir = await ensureSavedSessionsDir(context);
      const { stateFile, metaFile } = sessionFiles(dir, params.name);
      await Promise.all([
        fs.promises.rm(stateFile, { force: true }),
        fs.promises.rm(metaFile, { force: true }),
      ]);
      response.addTextResult(`Deleted session "${params.name}"`);
    },
  }),
];
