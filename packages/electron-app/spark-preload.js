/**
 * Copyright (c) Daryl Yourk. All rights reserved.
 * Licensed under the Apache License, Version 2.0.
 *
 * spark-preload.js — Preload script for Spark app tabs.
 *
 * Injects the `window.spark` namespace that GitHub Spark apps expect from
 * the private @github/spark package. All calls route through IPC to the
 * main process where lib/ipcSpark.js handles them using GitHub APIs.
 *
 * API surface matches the reverse-engineered window.spark interface:
 *   - spark.kv.keys()                          -> Promise<string[]>
 *   - spark.kv.get(key)                        -> Promise<T | undefined>
 *   - spark.kv.set(key, value)                 -> Promise<void>
 *   - spark.kv.delete(key)                     -> Promise<void>
 *   - spark.llm(prompt, modelName?, jsonMode?)  -> Promise<string>
 *   - spark.llmPrompt(strings, ...values)       -> string
 *   - spark.user()                              -> Promise<UserInfo>
 */

'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('spark', {
  kv: {
    keys:   ()           => ipcRenderer.invoke('spark:kv:keys'),
    get:    (key)        => ipcRenderer.invoke('spark:kv:get', key),
    set:    (key, value) => ipcRenderer.invoke('spark:kv:set', key, value),
    delete: (key)        => ipcRenderer.invoke('spark:kv:delete', key),
  },

  llm: (prompt, modelName, jsonMode) =>
    ipcRenderer.invoke('spark:llm', prompt, modelName, jsonMode),

  llmPrompt: (strings, ...values) => {
    // Tagged template literal — runs locally, no IPC needed.
    let result = '';
    for (let i = 0; i < strings.length; i++) {
      result += strings[i];
      if (i < values.length) result += String(values[i]);
    }
    return result;
  },

  user: () => ipcRenderer.invoke('spark:user'),
});

// Also expose the standard copilotbrowser API so Spark tabs
// can use tab management and navigation if needed.
contextBridge.exposeInMainWorld('copilotbrowser', {
  tabs: {
    create:   (payload) => ipcRenderer.invoke('tabs:create', payload),
    activate: (id)      => ipcRenderer.invoke('tabs:activate', id),
    close:    (id)      => ipcRenderer.invoke('tabs:close', id),
    list:     ()        => ipcRenderer.invoke('tabs:list'),
    onState:  (cb)      => ipcRenderer.on('tabs:state', (_e, state) => cb(state)),
  },
  nav: {
    goBack:    () => ipcRenderer.invoke('nav:back'),
    goForward: () => ipcRenderer.invoke('nav:forward'),
    reload:    () => ipcRenderer.invoke('nav:reload'),
    stop:      () => ipcRenderer.invoke('nav:stop'),
    navigate:  (url) => ipcRenderer.invoke('nav:navigate', url),
    onState:   (cb) => ipcRenderer.on('nav:state', (_e, state) => cb(state)),
  },
  settings: {
    get:    ()      => ipcRenderer.invoke('settings:get'),
    set:    (patch) => ipcRenderer.invoke('settings:set', patch),
    delete: (key)   => ipcRenderer.invoke('settings:delete', { key }),
  },
});
