/**
 * Copyright (c) Daryl Yourk. All rights reserved.
 * Licensed under the Apache License, Version 2.0.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('copilotbrowser', {
  runCommand: (command, args, cwd) => ipcRenderer.invoke('run-command', { command, args, cwd }),
  onProjectOpened: (callback) => ipcRenderer.on('project-opened', (event, path) => callback(path)),
  onAction: (callback) => ipcRenderer.on('action', (event, action) => callback(action)),
  tabs: {
    create: (payload) => ipcRenderer.invoke('tabs:create', payload),
    activate: (id) => ipcRenderer.invoke('tabs:activate', id),
    close: (id) => ipcRenderer.invoke('tabs:close', id),
    list: () => ipcRenderer.invoke('tabs:list'),
    onState: (callback) => ipcRenderer.on('tabs:state', (event, state) => callback(state)),
  },
  nav: {
    goBack: () => ipcRenderer.invoke('nav:back'),
    goForward: () => ipcRenderer.invoke('nav:forward'),
    reload: () => ipcRenderer.invoke('nav:reload'),
    stop: () => ipcRenderer.invoke('nav:stop'),
    navigate: (url) => ipcRenderer.invoke('nav:navigate', url),
    onState: (callback) => ipcRenderer.on('nav:state', (event, state) => callback(state)),
  },
  // WebView2 parity bridge (ADR-001 Phase 3 foundation).
  // Exposes read-only status so the renderer can display capability info.
  webview2: {
    getStatus: () => ipcRenderer.invoke('webview2:status'),
  },
  // Feature flags — renderer can query active flags for conditional UI.
  flags: {
    get: () => ipcRenderer.invoke('flags:get'),
  },
  // Persistence — history, favorites, settings (backed by lib/store.js).
  history: {
    list: (opts) => ipcRenderer.invoke('history:list', opts),
    clear: () => ipcRenderer.invoke('history:clear'),
    remove: (url, visitedAt) => ipcRenderer.invoke('history:remove', { url, visitedAt }),
  },
  favorites: {
    list: () => ipcRenderer.invoke('favorites:list'),
    add: (url, title) => ipcRenderer.invoke('favorites:add', { url, title }),
    remove: (url) => ipcRenderer.invoke('favorites:remove', { url }),
    is: (url) => ipcRenderer.invoke('favorites:is', { url }),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (patch) => ipcRenderer.invoke('settings:set', patch),
    delete: (key) => ipcRenderer.invoke('settings:delete', { key }),
  },
});
