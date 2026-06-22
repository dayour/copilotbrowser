# copilotbrowser

[![npm version](https://img.shields.io/npm/v/copilotbrowser.svg)](https://www.npmjs.com/package/copilotbrowser)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

copilotbrowser is a high-level browser automation framework for Node.js supporting Chromium, Firefox, and WebKit with a single API. It includes a built-in MCP server that lets GitHub Copilot, Claude, and any MCP-compatible AI agent control a real browser directly.

Unique to copilotbrowser is **"follow me" mode**: an AI agent watches you navigate a site step-by-step, then replays those exact actions autonomously — including form fills, multi-step flows, and complex UI interactions.

## Supported Browsers

| Browser | Version |
|---------|---------|
| Chromium | <!-- GEN:chromium-version -->146.0.7680.0<!-- GEN:stop --> |
| Firefox | <!-- GEN:firefox-version -->146.0.1<!-- GEN:stop --> |
| WebKit | <!-- GEN:webkit-version -->26.0<!-- GEN:stop --> |

<!-- GEN:chromium-version-badge -->[![Chromium version](https://img.shields.io/badge/chromium-146.0.7680.0-blue.svg?logo=google-chrome)](https://www.chromium.org/Home)<!-- GEN:stop -->
<!-- GEN:firefox-version-badge -->[![Firefox version](https://img.shields.io/badge/firefox-146.0.1-blue.svg?logo=firefoxbrowser)](https://www.mozilla.org/en-US/firefox/new/)<!-- GEN:stop -->
<!-- GEN:webkit-version-badge -->[![WebKit version](https://img.shields.io/badge/webkit-26.0-blue.svg?logo=safari)](https://webkit.org/)<!-- GEN:stop -->

## Requirements

- **Node.js** ≥ 25.6.1
- Windows, macOS, or Linux

## Installation

### Test Framework

```bash
npm init copilotbrowser@latest
```

This scaffolds a new project (or augments an existing one) with a `copilotbrowser.config.ts`, example tests, and prompts to install browsers.

To add copilotbrowser to an existing project manually:

```bash
npm install --save-dev @copilotbrowser/test
npx copilotbrowser install
```

### Library-only

```bash
npm install copilotbrowser
npx copilotbrowser install
```

### VS Code Extension

The **copilotbrowser** VS Code extension automatically registers the MCP server so GitHub Copilot Chat can control a browser without any manual configuration.

Install from the VS Code Marketplace (search **copilotbrowser**) or via npm:

```bash
npm install @copilotbrowser
```

On activation the extension writes:
- `.vscode/mcp.json` — VS Code 1.99+ native MCP discovery
- `.github/copilot/mcp.json` — GitHub Copilot repo-level config (if `.github/` exists)

Both files are safe to commit; paths are workspace-relative and portable across operating systems.

## MCP Server (AI Agent / Copilot Integration)

To use copilotbrowser as an MCP tool server for GitHub Copilot, Claude, or any MCP-compatible AI agent, add the following to your `.mcp.json` (or use the VS Code extension to configure it automatically):

```json
{
  "mcpServers": {
    "copilotbrowser": {
      "command": "npx",
      "args": ["copilotbrowser", "run-mcp-server", "--browser", "msedge"]
    }
  }
}
```

**Browser options:** `msedge`, `chromium`, `chrome`, `firefox`, `webkit`

**Optional capability packs** (add via `--caps`):

| Cap | What it enables |
|-----|----------------|
| `vision` | Screenshot-based visual reasoning |
| `pdf` | Save pages as PDF |
| `devtools` | Chrome DevTools Protocol access |

Example with capabilities:

```bash
npx copilotbrowser run-mcp-server --browser msedge --caps vision,pdf
```

The MCP server exposes 32+ browser tools: navigate, click, type, screenshot, observe, fill forms, run JavaScript, manage tabs, record interactions, handle dialogs, and more.

### "Follow Me" Mode

```
browser_follow_me_start   → AI begins recording your actions
browser_follow_me_stop    → AI stops recording
browser_follow_me_replay  → AI replays the recorded workflow autonomously
```

## AI Test Agents

copilotbrowser ships three AI test agents — **planner**, **generator**, and **healer** — that work with GitHub Copilot, Claude, or any MCP-compatible AI loop to build and maintain your test suite automatically.

Initialize agent definitions for your AI tool:

```bash
npx copilotbrowser init-agents --loop=vscode   # GitHub Copilot in VS Code
npx copilotbrowser init-agents --loop=claude    # Claude Code
npx copilotbrowser init-agents --loop=opencode  # OpenCode
```

| Agent | What it does |
|-------|-------------|
| **planner** | Explores your app and produces a Markdown test plan |
| **generator** | Transforms the test plan into copilotbrowser `.spec.ts` test files |
| **healer** | Runs the test suite and automatically repairs failing tests |

> VS Code v1.105 or later is required for the agentic experience in VS Code.

## Usage

### Browser Automation (Library)

```js
const { chromium } = require('copilotbrowser');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
})();
```

### End-to-End Tests

```ts
import { test, expect } from '@copilotbrowser/test';

test('homepage has title', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example Domain/);
});
```

Run tests:

```bash
npx copilotbrowser test
npx copilotbrowser test --headed           # show browser window
npx copilotbrowser test --project=chromium # one browser only
npx copilotbrowser test --ui               # interactive UI mode
```

## Developer Setup (from source)

```bash
git clone https://github.com/dayour/copilotbrowser
cd copilotbrowser
bash install.sh
```

Or step by step:

```bash
npm ci
npm run build
npx copilotbrowser install
```

## Documentation

See the [docs/](docs/) folder for full API reference and guides.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to build, test, and submit changes.

## License

[Apache 2.0](LICENSE)
