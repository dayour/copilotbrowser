/**
 * Copyright (c) Daryl Yourk. All rights reserved.
 * Licensed under the Apache License, Version 2.0.
 *
 * ipcSpark.js — Main-process IPC handlers for the window.spark API.
 *
 * Implements the Spark runtime APIs (kv, llm, user) using:
 *   - GitHub Contents API for KV store (repo-backed _kv.json)
 *   - GitHub Models for LLM inference (OpenAI-compatible endpoint)
 *   - GitHub REST API /user for user context
 *
 * All calls use the GitHub token from the CopilotClient session.
 */

'use strict';

const { ipcMain } = require('electron');

const GITHUB_API = 'https://api.github.com';
const GITHUB_MODELS = 'https://models.inference.ai.azure.com';

let _config = null;

/**
 * Make an authenticated GitHub API request.
 */
async function ghFetch(url, options = {}) {
  const headers = {
    Authorization: `Bearer ${_config.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(options.headers || {}),
  };
  if (options.body) headers['Content-Type'] = 'application/json';

  const res = await fetch(url.startsWith('http') ? url : `${GITHUB_API}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub ${res.status}: ${body}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : undefined;
}

// ---------------------------------------------------------------------------
// KV Store — backed by a JSON file in a GitHub repo via Contents API.
// ---------------------------------------------------------------------------

async function kvReadStore() {
  const { owner, repo, branch, kvPath } = _config;
  try {
    const res = await ghFetch(`/repos/${owner}/${repo}/contents/${kvPath}?ref=${branch}`);
    const decoded = Buffer.from(res.content, 'base64').toString('utf-8');
    return { data: JSON.parse(decoded), sha: res.sha };
  } catch (err) {
    if (err.message.includes('404')) return { data: {}, sha: null };
    throw err;
  }
}

async function kvWriteStore(data, sha) {
  const { owner, repo, branch, kvPath } = _config;
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const body = { message: 'copilotspark: update kv store', content, branch };
  if (sha) body.sha = sha;
  await ghFetch(`/repos/${owner}/${repo}/contents/${kvPath}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// LLM — GitHub Models (OpenAI-compatible chat completions).
// ---------------------------------------------------------------------------

async function llmCall(prompt, modelName, jsonMode) {
  const model = modelName || _config.defaultModel || 'gpt-4o';
  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const res = await fetch(`${GITHUB_MODELS}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${_config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub Models ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ---------------------------------------------------------------------------
// User — GitHub REST API /user.
// ---------------------------------------------------------------------------

let _cachedUser = null;

async function getUser() {
  if (_cachedUser) return _cachedUser;
  const raw = await ghFetch('/user');

  let isOwner = false;
  if (_config.owner && _config.repo) {
    try {
      await ghFetch(`/repos/${_config.owner}/${_config.repo}`);
      isOwner = raw.login === _config.owner;
    } catch { isOwner = false; }
  }

  _cachedUser = {
    login: raw.login,
    id: raw.id,
    avatar_url: raw.avatar_url,
    name: raw.name || null,
    email: raw.email || null,
    isOwner,
  };
  return _cachedUser;
}

// ---------------------------------------------------------------------------
// Registration — call from main.js after auth is available.
// ---------------------------------------------------------------------------

/**
 * Register all spark:* IPC handlers.
 *
 * @param {object} config
 * @param {string} config.token    - GitHub token (PAT or OAuth)
 * @param {string} config.owner    - GitHub user/org owning the KV repo
 * @param {string} config.repo     - KV repo name (created if missing)
 * @param {string} [config.branch] - Branch for KV (default: 'main')
 * @param {string} [config.kvPath] - KV file path (default: '_kv.json')
 * @param {string} [config.defaultModel] - Default LLM model (default: 'gpt-4o')
 */
function registerSparkIPC(config) {
  _config = {
    branch: 'main',
    kvPath: '_kv.json',
    defaultModel: 'gpt-4o',
    ...config,
  };

  // Ensure KV repo exists (fire and forget at startup).
  ghFetch(`/repos/${_config.owner}/${_config.repo}`).catch(async () => {
    try {
      await ghFetch('/user/repos', {
        method: 'POST',
        body: JSON.stringify({
          name: _config.repo,
          private: true,
          description: 'copilotspark KV store — auto-created by copilotbrowser',
          auto_init: true,
        }),
      });
      console.log(`[spark] Created KV repo: ${_config.owner}/${_config.repo}`);
    } catch (err) {
      console.warn(`[spark] Could not create KV repo: ${err.message}`);
    }
  });

  // --- KV handlers ---
  ipcMain.handle('spark:kv:keys', async () => {
    const { data } = await kvReadStore();
    return Object.keys(data);
  });

  ipcMain.handle('spark:kv:get', async (_event, key) => {
    const { data } = await kvReadStore();
    return data[key];
  });

  ipcMain.handle('spark:kv:set', async (_event, key, value) => {
    const { data, sha } = await kvReadStore();
    data[key] = value;
    await kvWriteStore(data, sha);
  });

  ipcMain.handle('spark:kv:delete', async (_event, key) => {
    const { data, sha } = await kvReadStore();
    delete data[key];
    await kvWriteStore(data, sha);
  });

  // --- LLM handler ---
  ipcMain.handle('spark:llm', async (_event, prompt, modelName, jsonMode) => {
    return llmCall(prompt, modelName, jsonMode);
  });

  // --- User handler ---
  ipcMain.handle('spark:user', async () => {
    return getUser();
  });

  console.log('[spark] IPC handlers registered');
}

module.exports = { registerSparkIPC };
