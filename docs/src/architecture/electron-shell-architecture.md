---
id: electron-shell-architecture
title: "Electron Shell Architecture"
---

# Electron Shell Architecture (ADR-001)

**Status:** Accepted | **Date:** 2025-07-18

## Summary

The copilotbrowser desktop shell uses **`BaseWindow` + `WebContentsView`** composition in Electron 40+ to deliver a multi-tab browser experience with a Windows-first WebView2 parity path.

## Architecture

```txt
BaseWindow (frameless on Windows)
  +-- Chrome View (WebContentsView): tab bar, address bar, nav controls
  +-- Tab View N (WebContentsView): one per tab, only active tab visible
```

- **BrowserView** is rejected (deprecated Electron 30+).
- **`<webview>` tag** is rejected (security model, no WebView2 bridge path).
- Main process owns all tab state. Chrome View is a stateless rendering layer.
- IPC follows typed channel pattern from `packages/protocol`.

## Tab Lifecycle

```txt
CREATING -> LOADING -> READY -> CLOSING -> DESTROYED
                |                  |
                +-> ERROR     SUSPENDED (memory reclaim)
```

Each tab is a `WebContentsView` with process isolation. Tabs beyond `maxActiveTabs` are suspended (LRU).

## IPC Contract

**Commands** (renderer -> main, request/response via `ipcRenderer.invoke`):
- `tab:create`, `tab:close`, `tab:activate`, `tab:move`, `tab:duplicate`
- `nav:go`, `nav:back`, `nav:forward`, `nav:reload`, `nav:stop`
- `persist:get-history`, `persist:get-favorites`, `persist:get-settings`
- `flags:get`, `flags:set`

**Events** (main -> renderer, push via `webContents.send`):
- `tab:created`, `tab:closed`, `tab:updated`, `tab:activated`
- `nav:did-navigate`, `nav:did-fail`

All messages are JSON-serializable with TypeScript interfaces.

## Persistence

| Data | Storage | Lifetime |
|------|---------|----------|
| History | SQLite | 90-day rolling |
| Favorites | SQLite | Permanent |
| Session (open tabs) | JSON | Per-shutdown |
| Settings | JSON | Permanent |
| Feature flags | JSON | Permanent, env-overridable |

Stored under `{userData}/copilotbrowser-shell/`.

## WebView2 Parity Bridge (Windows)

The shell chrome always runs in Electron. Tab content can optionally use WebView2 on Windows:

```ts
interface ITabContentView {
  loadURL(url: string): void;
  goBack(): void;
  goForward(): void;
  reload(ignoreCache?: boolean): void;
  stop(): void;
  // ... navigation events
}

// Factory selects backend based on feature flags + platform
function createTabContentView(options): ITabContentView {
  if (options.flags.useWebView2 && process.platform === 'win32')
    return new WebView2TabContentView(options);
  return new ElectronTabContentView(options);
}
```

WebView2 integration uses a native Node.js addon (`copilotbrowser-webview2-host`) that creates `CoreWebView2` as a child HWND. Falls back to Electron if WebView2 runtime is unavailable.

## Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `useWebView2` | `false` | WebView2 tab content on Windows |
| `enableTabSuspension` | `true` | Suspend inactive tabs |
| `enableSessionRestore` | `true` | Restore tabs on launch |
| `maxActiveTabs` | `20` | Tabs before suspension |
| `customTitleBar` | `true` (Windows) | Frameless window |

## Rollout

1. **Phase 1** (Wk 1-4): Foundation -- BaseWindow + tabs + IPC + persistence
2. **Phase 2** (Wk 5-8): Polish -- title bar, downloads, favorites, keyboard shortcuts
3. **Phase 3** (Wk 9-14): WebView2 bridge -- native addon, `ITabContentView` abstraction
4. **Phase 4** (Wk 15-18): GA -- staged rollout 10% -> 100%, automatic rollback on crash spike

Kill switch at every phase: `COPILOTBROWSER_SHELL=legacy` reverts to previous launcher.

## Full ADR

The complete ADR with detailed schemas, state machines, risk matrix, and code examples is maintained in the session-state archive (ADR-001).
