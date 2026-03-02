/**
 * Copyright (c) Daryl Yourk. All rights reserved.
 * Licensed under the Apache License, Version 2.0.
 */

const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const { getFlags } = require('./lib/feature-flags');
const { createTabContentView } = require('./lib/tab-content-view');
const { getWebView2Status } = require('./lib/webview2-adapter');
const { store } = require('./lib/store');

// Feature flags resolved once at startup (env > file > defaults).
// See lib/feature-flags.js for resolution order and enablement docs.
let flags;

// Legacy compat: TAB_FEATURE_ENABLED is now derived from the unified flag system.
// It remains a module-level const for readability in the IPC handlers below.
let TAB_FEATURE_ENABLED;

let mainWindow;
let tabManager;

function safeParseScheme(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol.replace(':', '');
  } catch (err) {
    return '';
  }
}

class TabManager {
  constructor(window, enabled, resolvedFlags = {}) {
    this.window = window;
    this.enabled = enabled;
    this.flags = resolvedFlags;
    this.tabs = new Map();
    this.activeTabId = null;
    this.viewportPadding = { top: 0, bottom: 0, left: 0, right: 0 };

    if (!this.enabled) return;

    // Reserve vertical space for titlebar (40px) + navigation bar (40px).
    // Must stay in sync with the renderer CSS heights.
    this.viewportPadding.top = 80;

    this.window.on('resize', () => this.layoutActiveView());
    this.window.on('closed', () => this.teardown());
  }

  isEnabled() {
    return this.enabled;
  }

  teardown() {
    this.tabs.forEach((tab) => {
      try {
        this.window?.contentView?.removeChildView(tab.view);
      } catch (err) {
        // no-op
      }
      // Use the adapter destroy if available; otherwise fall back to direct webContents destroy.
      if (tab.contentView) {
        tab.contentView.destroy();
      } else {
        tab.view?.webContents?.destroy();
      }
    });
    this.tabs.clear();
    this.activeTabId = null;
  }

  getViewportBounds() {
    const bounds = this.window.getContentBounds();
    return {
      x: this.viewportPadding.left,
      y: this.viewportPadding.top,
      width: Math.max(0, bounds.width - this.viewportPadding.left - this.viewportPadding.right),
      height: Math.max(0, bounds.height - this.viewportPadding.top - this.viewportPadding.bottom),
    };
  }

  createTab(payload = {}) {
    if (!this.enabled) return { ok: false, reason: 'disabled' };

    const id = crypto.randomUUID();
    const url = payload.url || 'about:blank';

    // -- WebView2 parity bridge (ADR-001 Phase 3 foundation) -----------------
    // Use the adapter factory to select the tab content backend.
    // When useWebView2 flag is on + Windows + runtime detected, the factory
    // returns a WebView2-backed view (currently a stub that renders via
    // Electron fallback). When the flag is off or on non-Windows, it returns
    // the standard Electron WebContentsView — zero behavioral change.
    const contentView = createTabContentView({ flags: this.flags, window: this.window });

    contentView.setBounds(this.getViewportBounds());
    contentView.setVisible(false);

    // The nativeView property gives us the raw Electron WebContentsView
    // needed for addChildView/removeChildView on the parent window.
    this.window.contentView.addChildView(contentView.nativeView);

    contentView.loadURL(url);

    const tab = {
      id,
      url,
      title: payload.title || payload.url || 'New Tab',
      view: contentView.nativeView,      // raw Electron view (layout compat)
      contentView,                        // adapter (navigation + events)
      backendType: contentView.getBackendType(),
      lastLoadError: null,
      lastCertError: null,
    };

    this.tabs.set(id, tab);
    this.setupTabNavigation(tab);

    if (!this.activeTabId) {
      this.activateTab(id);
    } else {
      this.publishState();
    }

    return { ok: true, tab: this.serializeTab(tab), activeTabId: this.activeTabId };
  }

  activateTab(id) {
    if (!this.enabled) return { ok: false, reason: 'disabled' };
    const tab = this.tabs.get(id);
    if (!tab) return { ok: false, reason: 'not-found' };

    this.tabs.forEach((entry) => entry.view.setVisible(false));
    tab.view.setBounds(this.getViewportBounds());
    tab.view.setVisible(true);
    tab.view.webContents.focus();

    this.activeTabId = id;
    this.publishState();
    this.publishNavState(id);
    return { ok: true, tab: this.serializeTab(tab), activeTabId: id };
  }

  closeTab(id) {
    if (!this.enabled) return { ok: false, reason: 'disabled' };
    const tab = this.tabs.get(id);
    if (!tab) return { ok: false, reason: 'not-found' };

    try {
      this.window.contentView.removeChildView(tab.view);
    } catch (err) {
      // no-op
    }
    if (tab.contentView) {
      tab.contentView.destroy();
    } else {
      tab.view.webContents.destroy();
    }
    this.tabs.delete(id);

    if (this.activeTabId === id) {
      const nextId = this.tabs.keys().next().value || null;
      this.activeTabId = null;
      if (nextId) this.activateTab(nextId);
    }

    this.publishState();
    if (!this.activeTabId) {
      this.publishNavState(null);
    }
    return { ok: true, closedId: id, activeTabId: this.activeTabId };
  }

  listTabs() {
    return {
      ok: true,
      enabled: this.enabled,
      tabs: Array.from(this.tabs.values()).map((tab) => this.serializeTab(tab)),
      activeTabId: this.activeTabId,
    };
  }

  layoutActiveView() {
    if (!this.enabled || !this.activeTabId) return;
    const tab = this.tabs.get(this.activeTabId);
    if (!tab) return;
    tab.view.setBounds(this.getViewportBounds());
  }

  setupTabNavigation(tab) {
    // If the tab has an adapter (contentView), use its unified event surface.
    // Otherwise fall back to direct webContents events (legacy compat).
    const cv = tab.contentView;
    const emitNavState = () => {
      const alive = cv ? !cv.isDestroyed() : (tab.view.webContents && !tab.view.webContents.isDestroyed());
      if (alive && tab.id === this.activeTabId) {
        this.publishNavState(tab.id);
      }
    };

    if (cv) {
      cv.on('did-navigate', (url) => {
        tab.url = url; tab.lastLoadError = null;
        store.addHistoryEntry(url, tab.title);
        emitNavState();
      });
      cv.on('did-navigate-in-page', (url) => {
        tab.url = url; tab.lastLoadError = null;
        store.addHistoryEntry(url, tab.title);
        emitNavState();
      });
      cv.on('page-title-updated', (title) => {
        tab.title = title;
        store.updateHistoryTitle(tab.url, title);
        emitNavState();
        this.publishState();
      });
      cv.on('did-start-loading', () => {
        tab.lastLoadError = null;
        tab.lastCertError = null;
        emitNavState();
      });
      cv.on('did-stop-loading', emitNavState);
      cv.on('did-fail-load', (err) => { tab.lastLoadError = err; emitNavState(); });
      cv.on('did-fail-provisional-load', (err) => { tab.lastLoadError = err; emitNavState(); });
      cv.on('certificate-error', (err) => { tab.lastCertError = err; emitNavState(); });
    } else {
      // Legacy path (no adapter) — direct webContents events.
      const wc = tab.view.webContents;
      wc.on('did-navigate', (_event, url) => {
        tab.url = url; tab.lastLoadError = null;
        store.addHistoryEntry(url, tab.title);
        emitNavState();
      });
      wc.on('did-navigate-in-page', (_event, url) => {
        tab.url = url; tab.lastLoadError = null;
        store.addHistoryEntry(url, tab.title);
        emitNavState();
      });
      wc.on('page-title-updated', (_event, title) => {
        tab.title = title;
        store.updateHistoryTitle(tab.url, title);
        emitNavState();
        this.publishState();
      });
      wc.on('did-start-loading', () => {
        tab.lastLoadError = null;
        tab.lastCertError = null;
        emitNavState();
      });
      wc.on('did-stop-loading', emitNavState);
      wc.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
        tab.lastLoadError = { errorCode, errorDescription, validatedURL, isMainFrame };
        emitNavState();
      });
      wc.on('did-fail-provisional-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
        tab.lastLoadError = { errorCode, errorDescription, validatedURL, isMainFrame };
        emitNavState();
      });
      wc.on('certificate-error', (event, url, error, certificate, callback) => {
        event.preventDefault();
        tab.lastCertError = { url, error, certificate };
        if (typeof callback === 'function') callback(false);
        emitNavState();
      });
    }
  }

  publishNavState(tabId) {
    if (!this.window || this.window.isDestroyed()) return;
    if (!tabId) {
      this.window.webContents.send('nav:state', {
        tabId: null, url: '', title: '', canGoBack: false, canGoForward: false, isLoading: false,
        backendType: 'electron',
        scheme: '',
        isSecure: false,
        certificateError: null,
        loadError: null,
      });
      return;
    }
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    const cv = tab.contentView;
    const wc = tab.view.webContents;
    const alive = cv ? !cv.isDestroyed() : (wc && !wc.isDestroyed());
    if (!alive) return;
    const currentUrl = (cv ? cv.getURL() : wc.getURL()) || tab.url;
    const parsedScheme = safeParseScheme(currentUrl);
    const isSecure = parsedScheme === 'https';

    this.window.webContents.send('nav:state', {
      tabId: tab.id,
      url: currentUrl,
      title: tab.title,
      canGoBack: cv ? cv.canGoBack() : wc.canGoBack(),
      canGoForward: cv ? cv.canGoForward() : wc.canGoForward(),
      isLoading: cv ? cv.isLoading() : wc.isLoading(),
      backendType: tab.backendType || 'electron',
      scheme: parsedScheme,
      isSecure,
      certificateError: tab.lastCertError || null,
      loadError: tab.lastLoadError || null,
    });
  }

  navigateBack() {
    if (!this.enabled || !this.activeTabId) return { ok: false };
    const tab = this.tabs.get(this.activeTabId);
    if (!tab || tab.view.webContents.isDestroyed()) return { ok: false };
    if (!tab.view.webContents.canGoBack()) return { ok: false };
    tab.view.webContents.goBack();
    return { ok: true };
  }

  navigateForward() {
    if (!this.enabled || !this.activeTabId) return { ok: false };
    const tab = this.tabs.get(this.activeTabId);
    if (!tab || tab.view.webContents.isDestroyed()) return { ok: false };
    if (!tab.view.webContents.canGoForward()) return { ok: false };
    tab.view.webContents.goForward();
    return { ok: true };
  }

  reloadTab() {
    if (!this.enabled || !this.activeTabId) return { ok: false };
    const tab = this.tabs.get(this.activeTabId);
    if (!tab || tab.view.webContents.isDestroyed()) return { ok: false };
    tab.view.webContents.reload();
    return { ok: true };
  }

  stopTab() {
    if (!this.enabled || !this.activeTabId) return { ok: false };
    const tab = this.tabs.get(this.activeTabId);
    if (!tab || tab.view.webContents.isDestroyed()) return { ok: false };
    tab.view.webContents.stop();
    return { ok: true };
  }

  navigate(url) {
    if (!this.enabled) return { ok: false, reason: 'disabled' };
    const sanitized = this.sanitizeUrl(url);
    if (!sanitized) return { ok: false, reason: 'invalid-url' };

    if (!this.activeTabId) {
      return this.createTab({ url: sanitized });
    }

    const tab = this.tabs.get(this.activeTabId);
    if (!tab || tab.view.webContents.isDestroyed()) return { ok: false, reason: 'not-found' };
    tab.view.webContents.loadURL(sanitized).catch(() => {});
    return { ok: true, url: sanitized };
  }

  /** Minimal URL sanitisation. Blocks dangerous schemes; prepends https:// for bare hosts. */
  sanitizeUrl(input) {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (/^(javascript|data|vbscript):/i.test(trimmed)) return null;
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) return trimmed;
    if (!trimmed.includes(' ') && (/\./.test(trimmed) || /:\d+/.test(trimmed))) {
      return 'https://' + trimmed;
    }
    if (/^localhost(\/|$)/.test(trimmed)) return 'https://' + trimmed;
    return null;
  }

  serializeTab(tab) {
    const cv = tab.contentView;
    const wc = tab.view?.webContents;
    const alive = cv ? !cv.isDestroyed() : (wc && !wc.isDestroyed());
    return {
      id: tab.id,
      url: alive ? (cv ? cv.getURL() : wc.getURL()) || tab.url : tab.url,
      title: tab.title,
      canGoBack: alive ? (cv ? cv.canGoBack() : wc.canGoBack()) : false,
      canGoForward: alive ? (cv ? cv.canGoForward() : wc.canGoForward()) : false,
      isLoading: alive ? (cv ? cv.isLoading() : wc.isLoading()) : false,
      backendType: tab.backendType || 'electron',
      scheme: safeParseScheme(alive ? (cv ? cv.getURL() : wc.getURL()) || tab.url : tab.url),
      isSecure: safeParseScheme(alive ? (cv ? cv.getURL() : wc.getURL()) || tab.url : tab.url) === 'https',
      certificateError: tab.lastCertError || null,
      loadError: tab.lastLoadError || null,
    };
  }

  publishState() {
    if (!this.window || this.window.isDestroyed()) return;
    this.window.webContents.send('tabs:state', this.listTabs());
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'copilotbrowser',
    icon: path.join(__dirname, 'build', process.platform === 'win32' ? 'icon.ico' : 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  if (TAB_FEATURE_ENABLED) {
    tabManager = new TabManager(mainWindow, true, flags);
  } else {
    tabManager = new TabManager(mainWindow, false, flags);
  }

  mainWindow.on('closed', () => {
    tabManager?.teardown();
    mainWindow = null;
  });
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Test Project',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory'],
              title: 'Open copilotbrowser Test Project',
            });
            if (!result.canceled && result.filePaths.length > 0)
              mainWindow.webContents.send('project-opened', result.filePaths[0]);
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Tools',
      submenu: [
        {
          label: 'Record New Test',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => mainWindow.webContents.send('action', 'codegen'),
        },
        {
          label: 'Open Inspector',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow.webContents.send('action', 'inspector'),
        },
        {
          label: 'Show Trace Viewer',
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => mainWindow.webContents.send('action', 'trace'),
        },
        { type: 'separator' },
        {
          label: 'Install Browsers',
          click: () => mainWindow.webContents.send('action', 'install'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'copilotbrowser Documentation',
          click: () => {
            const { shell } = require('electron');
            shell.openExternal('https://github.com/dayour/copilotbrowser');
          },
        },
        { type: 'separator' },
        {
          label: `About copilotbrowser v${app.getVersion()}`,
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About copilotbrowser',
              message: `copilotbrowser v${app.getVersion()}`,
              detail: 'Browser automation and testing.\nCopyright (c) Daryl Yourk.',
              icon: path.join(__dirname, 'build', 'icon.png'),
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for renderer process
ipcMain.handle('run-command', async (event, { command, args, cwd }) => {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { cwd, shell: true });
    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', (data) => { stdout += data.toString(); });
    proc.stderr?.on('data', (data) => { stderr += data.toString(); });
    proc.on('close', (code) => resolve({ code, stdout, stderr }));
    proc.on('error', (err) => reject(err.message));
  });
});

ipcMain.handle('tabs:create', (event, payload) => {
  if (!tabManager || !tabManager.isEnabled()) return { ok: false, reason: 'disabled' };
  return tabManager.createTab(payload);
});

ipcMain.handle('tabs:activate', (event, id) => {
  if (!tabManager || !tabManager.isEnabled()) return { ok: false, reason: 'disabled' };
  return tabManager.activateTab(id);
});

ipcMain.handle('tabs:close', (event, id) => {
  if (!tabManager || !tabManager.isEnabled()) return { ok: false, reason: 'disabled' };
  return tabManager.closeTab(id);
});

ipcMain.handle('tabs:list', () => {
  return tabManager ? tabManager.listTabs() : { ok: false, reason: 'uninitialized' };
});

ipcMain.handle('nav:back', () => {
  if (!tabManager || !tabManager.isEnabled()) return { ok: false, reason: 'disabled' };
  return tabManager.navigateBack();
});

ipcMain.handle('nav:forward', () => {
  if (!tabManager || !tabManager.isEnabled()) return { ok: false, reason: 'disabled' };
  return tabManager.navigateForward();
});

ipcMain.handle('nav:reload', () => {
  if (!tabManager || !tabManager.isEnabled()) return { ok: false, reason: 'disabled' };
  return tabManager.reloadTab();
});

ipcMain.handle('nav:stop', () => {
  if (!tabManager || !tabManager.isEnabled()) return { ok: false, reason: 'disabled' };
  return tabManager.stopTab();
});

ipcMain.handle('nav:navigate', (_event, url) => {
  if (!tabManager || !tabManager.isEnabled()) return { ok: false, reason: 'disabled' };
  return tabManager.navigate(url);
});

// IPC: WebView2 bridge status (diagnostic / renderer can display capability info).
ipcMain.handle('webview2:status', () => {
  return getWebView2Status();
});

// IPC: Feature flags query (renderer can adapt UI based on active flags).
ipcMain.handle('flags:get', () => {
  return flags || {};
});

// ---------------------------------------------------------------------------
// IPC: Persistence — history, favorites, settings
// ---------------------------------------------------------------------------

// -- History ----------------------------------------------------------------
ipcMain.handle('history:list', (_event, opts) => {
  return store.getHistory(opts);
});

ipcMain.handle('history:clear', () => {
  store.clearHistory();
  return { ok: true };
});

ipcMain.handle('history:remove', (_event, { url, visitedAt }) => {
  store.removeHistoryEntry(url, visitedAt);
  return { ok: true };
});

// -- Favorites --------------------------------------------------------------
ipcMain.handle('favorites:list', () => {
  return store.getFavorites();
});

ipcMain.handle('favorites:add', (_event, { url, title }) => {
  return store.addFavorite(url, title);
});

ipcMain.handle('favorites:remove', (_event, { url }) => {
  return store.removeFavorite(url);
});

ipcMain.handle('favorites:is', (_event, { url }) => {
  return store.isFavorite(url);
});

// -- Settings ---------------------------------------------------------------
ipcMain.handle('settings:get', () => {
  return store.getSettings();
});

ipcMain.handle('settings:set', (_event, patch) => {
  return store.setSettings(patch);
});

ipcMain.handle('settings:delete', (_event, { key }) => {
  return store.deleteSetting(key);
});

app.whenReady().then(() => {
  // Resolve feature flags once, before any window or manager is created.
  flags = getFlags();
  TAB_FEATURE_ENABLED = flags.enableTabs;

  // Log active flag state for diagnostics.
  console.log('[flags] Resolved feature flags:', JSON.stringify(flags));
  if (flags.useWebView2) {
    console.log('[webview2-bridge] useWebView2 flag is ON — checking runtime availability...');
    const status = getWebView2Status();
    console.log('[webview2-bridge] Status:', JSON.stringify(status));
  }

  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0)
      createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin')
    app.quit();
});

// Flush any pending persistence writes (history debounce) before exit.
app.on('before-quit', () => {
  store.flushAll();
});
