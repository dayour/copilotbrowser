# Changelog

All notable changes to copilotbrowser are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2026-06-22

### Added
- CHANGELOG.md to track changes between releases
- Stub source files for build-generated modules (injectedScriptSource, clockSource, etc.)
- Type declarations for `source-map-support` and `stoppable` bundle dependencies
- `json5` and `mdast-util-from-markdown` exports in utils bundle
- `types/component.ts` with Component, JsxComponent, MountOptions, ObjectComponentOptions types
- `snapshotMode` field to `SessionConfig.cli` interface

### Changed
- Upgraded all root devDependencies to latest (TypeScript 6, Vite 8, Electron 42, etc.)
- Upgraded `packages/CopilotBrowser` dependencies (playwright-core 1.51 to 1.61, zod 3 to 4, commander 13 to 15, etc.)
- Upgraded `packages/electron-app` (electron 40 to 42, electron-builder 26.8 to 26.15)
- Upgraded `packages/vscode-extension` dependencies (@types/vscode, @vscode/vsce, typescript)
- Migrated Vite 8 plugin hooks from rollup to rolldown types
- Updated chromium-bidi v16 import paths (removed `cjs/` subdirectory)
- Fixed `utils/workspace.js` paths for correct CopilotBrowser package directory casing
- Fixed all package references to use scoped `@copilotbrowser/copilotbrowser` name
- Fixed all lowercase `packages/copilotbrowser/` path references in build scripts

### Fixed
- Resolved 25 npm security vulnerabilities (now 0) via package overrides and updates
- Fixed `uuid`, `tar`, and `markdown-it` security vulnerabilities via npm overrides
- Fixed TypeScript compilation errors caused by case-sensitive directory naming (CopilotBrowser vs copilotbrowser) on Linux
- Fixed stale two-package relative imports across 11 source files
- Fixed `getEastAsianWidth` usage in `reporters/base.ts`
- Fixed `FrameBoundingRectsInfo` WeakMap typing in `snapshotRenderer.ts`
- Fixed chokidar 5.x `EventName` type broadening in `fsWatcher.ts`
- Fixed `WebSocketMessage` type cast in `webSocketMock.ts` for TypeScript strictness
- Fixed polymorphic `this` assignments in `CopilotBrowser.ts` constructor
- Fixed stale registry imports in `devtools/sessionModel.ts` and `devtools/grid.tsx`
- Fixed `fetch.ts` certificate CN field handling for `string | string[]` union type
- Fixed `vite.sw.config.ts` resolveImportMeta hook signature for Rollup 4 API
- Removed unused `@ts-expect-error` directives from vite config files after plugin upgrade
- Fixed `RouterFixture` import path in `ct/mount.ts`

### Security
- uuid: upgraded to >=11.1.1 (fixes GHSA-uuid vuln)
- tar: upgraded to >=7.5.16 (fixes path traversal vulnerability)
- markdown-it: upgraded to >=14.1.2 (fixes XSS vulnerability)

## [2.0.0] - 2026-03-03

### Added
- MCP Server with vision/screenshot support for AI agents
- Persistent browser sessions via profile directory
- Simplified Docker deployments
- Support for Chromium, Firefox, and WebKit

### Changed
- VS Code Extension ID updated to `DarbotLabs.copilotbrowser-vscode`

[2.0.1]: https://github.com/dayour/copilotbrowser/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/dayour/copilotbrowser/releases/tag/v2.0.0
