/**
 * Copyright (c) Daryl Yourk. All rights reserved.
 * Licensed under the Apache License, Version 2.0.
 *
 * Tab Content View — abstraction layer for tab rendering backends.
 *
 * Implements the ITabContentView pattern from ADR-001 (electron-shell-architecture).
 * The abstraction decouples tab content creation from the concrete Electron or
 * WebView2 implementation, allowing the factory to select the backend at runtime
 * based on feature flags and platform.
 *
 * Current backends:
 *   - ElectronTabContentView  (default, all platforms)
 *   - WebView2TabContentView  (Windows only, behind useWebView2 flag)
 *
 * Enablement:
 *   Set COPILOTBROWSER_FLAG_USE_WEBVIEW2=1 (or --enable-use-webview2) on Windows.
 *   When the flag is off or on non-Windows, the factory always returns the
 *   Electron backend — zero behavioral change from the pre-abstraction code path.
 *
 * Limitations (Phase 3 foundation):
 *   - WebView2TabContentView is a capability stub; it detects runtime availability
 *     but falls back to Electron for actual rendering until the native addon
 *     (copilotbrowser-webview2-host) ships.
 *   - Event surface is minimal (navigation + loading). Extended events (download,
 *     permission, certificate) will be added in Phase 3 proper.
 */

'use strict';

const { WebContentsView } = require('electron');
const { EventEmitter } = require('events');

// ---------------------------------------------------------------------------
// ITabContentView — the contract every backend must satisfy.
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} TabContentViewEvents
 * @property {'did-navigate'}       didNavigate         - (url: string)
 * @property {'did-navigate-in-page'} didNavigateInPage - (url: string)
 * @property {'page-title-updated'} pageTitleUpdated     - (title: string)
 * @property {'did-start-loading'}  didStartLoading      - ()
 * @property {'did-stop-loading'}   didStopLoading       - ()
 * @property {'did-fail-load'}      didFailLoad          - ({ errorCode, errorDescription, validatedURL, isMainFrame })
 * @property {'did-fail-provisional-load'} didFailProvisionalLoad - ({ errorCode, errorDescription, validatedURL, isMainFrame })
 * @property {'certificate-error'}  certificateError     - ({ url, error, certificate })
 */

/**
 * @typedef {Object} ITabContentView
 * @property {function(string): Promise<void>}  loadURL
 * @property {function(): void}                 goBack
 * @property {function(): void}                 goForward
 * @property {function(boolean=): void}         reload
 * @property {function(): void}                 stop
 * @property {function(): string}               getURL
 * @property {function(): boolean}              canGoBack
 * @property {function(): boolean}              canGoForward
 * @property {function(): boolean}              isLoading
 * @property {function(): boolean}              isDestroyed
 * @property {function(): void}                 focus
 * @property {function(Object): void}           setBounds
 * @property {function(boolean): void}          setVisible
 * @property {function(): void}                 destroy
 * @property {function(): string}               getBackendType - 'electron' | 'webview2'
 * @property {EventEmitter}                     events
 *
 * For Electron backend, the underlying WebContentsView is also accessible via
 * the `nativeView` property for compatibility with contentView.addChildView().
 */

// ---------------------------------------------------------------------------
// ElectronTabContentView — wraps WebContentsView (existing behavior).
// ---------------------------------------------------------------------------

class ElectronTabContentView extends EventEmitter {
  /**
   * @param {Object} options
   * @param {import('electron').BrowserWindow} options.window - Parent window.
   * @param {string} [options.preload] - Optional preload script path (e.g., spark-preload.js).
   */
  constructor(options = {}) {
    super();
    this._window = options.window || null;
    this._destroyed = false;

    const webPreferences = {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    };

    if (options.preload) {
      webPreferences.preload = options.preload;
      // Spark apps need sandbox relaxed for preload IPC to work.
      webPreferences.sandbox = false;
    }

    this._view = new WebContentsView({ webPreferences });

    // Block popup windows.
    this._view.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

    // Wire navigation events to the unified event surface.
    this._wireEvents();
  }

  /** @returns {'electron'} */
  getBackendType() { return 'electron'; }

  /** The raw Electron WebContentsView — needed for addChildView / removeChildView. */
  get nativeView() { return this._view; }

  /** The underlying webContents — needed for legacy TabManager interop. */
  get webContents() { return this._view?.webContents; }

  loadURL(url) {
    if (this._destroyed) return Promise.reject(new Error('destroyed'));
    return this._view.webContents.loadURL(url).catch(() => {});
  }

  goBack()    { if (!this._destroyed) this._view.webContents.goBack(); }
  goForward() { if (!this._destroyed) this._view.webContents.goForward(); }
  reload(ignoreCache) {
    if (this._destroyed) return;
    if (ignoreCache) this._view.webContents.reloadIgnoringCache();
    else this._view.webContents.reload();
  }
  stop() { if (!this._destroyed) this._view.webContents.stop(); }

  getURL()       { return this._destroyed ? '' : (this._view.webContents.getURL() || ''); }
  canGoBack()    { return !this._destroyed && this._view.webContents.canGoBack(); }
  canGoForward() { return !this._destroyed && this._view.webContents.canGoForward(); }
  isLoading()    { return !this._destroyed && this._view.webContents.isLoading(); }
  isDestroyed()  { return this._destroyed || this._view.webContents.isDestroyed(); }

  focus() { if (!this._destroyed) this._view.webContents.focus(); }

  setBounds(bounds) { if (!this._destroyed) this._view.setBounds(bounds); }
  setVisible(visible) { if (!this._destroyed) this._view.setVisible(visible); }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    try { this._view.webContents.destroy(); } catch (_) { /* no-op */ }
    this.removeAllListeners();
  }

  // -- internal ---------------------------------------------------------------

  _wireEvents() {
    const wc = this._view.webContents;

    wc.on('did-navigate', (_event, url) => {
      this.emit('did-navigate', url);
    });
    wc.on('did-navigate-in-page', (_event, url) => {
      this.emit('did-navigate-in-page', url);
    });
    wc.on('page-title-updated', (_event, title) => {
      this.emit('page-title-updated', title);
    });
    wc.on('did-start-loading', () => {
      this.emit('did-start-loading');
    });
    wc.on('did-stop-loading', () => {
      this.emit('did-stop-loading');
    });
    wc.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      this.emit('did-fail-load', { errorCode, errorDescription, validatedURL, isMainFrame });
    });
    wc.on('did-fail-provisional-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      this.emit('did-fail-provisional-load', { errorCode, errorDescription, validatedURL, isMainFrame });
    });
    wc.on('certificate-error', (event, url, error, certificate, callback) => {
      // Do not proceed on certificate errors; surface to UI and rely on user action (no auto-allow).
      this.emit('certificate-error', { url, error, certificate });
      event.preventDefault();
      if (typeof callback === 'function') callback(false);
    });
  }
}

// ---------------------------------------------------------------------------
// Factory — selects backend based on flags + platform.
// ---------------------------------------------------------------------------

/**
 * Create a tab content view using the appropriate backend.
 *
 * When useWebView2 is true AND platform is win32 AND the WebView2 runtime is
 * available, this will return a WebView2-backed view. In all other cases it
 * returns the standard Electron backend.
 *
 * @param {Object}  options
 * @param {Object}  options.flags    - Resolved feature flags (from getFlags()).
 * @param {import('electron').BrowserWindow} options.window - Parent window.
 * @returns {ElectronTabContentView} Currently always returns the Electron backend.
 *          Will return ITabContentView (possibly WebView2) once the native addon ships.
 */
function createTabContentView(options) {
  const flags = options.flags || {};

  // Gate: WebView2 path requires flag + Windows + runtime availability.
  if (flags.useWebView2 && process.platform === 'win32') {
    try {
      // Lazy-require so the module is never loaded when the flag is off.
      const { WebView2TabContentView, isWebView2Available } = require('./webview2-adapter');

      if (isWebView2Available()) {
        return new WebView2TabContentView(options);
      }

      // Runtime not installed — log and fall through to Electron.
      console.warn(
        '[webview2-bridge] useWebView2 flag is on but WebView2 runtime was not detected. ' +
        'Falling back to Electron tab backend.'
      );
    } catch (err) {
      // Module load failure (e.g., native addon not compiled) — fall through.
      console.warn(
        '[webview2-bridge] Failed to load WebView2 adapter:', err.message,
        '— falling back to Electron tab backend.'
      );
    }
  }

  // Default: Electron backend (unchanged behavior).
  return new ElectronTabContentView(options);
}

module.exports = {
  ElectronTabContentView,
  createTabContentView,
};
