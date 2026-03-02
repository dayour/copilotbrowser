# copilotbrowser

[![npm version](https://img.shields.io/npm/v/copilotbrowser.svg)](https://www.npmjs.com/package/copilotbrowser)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)

copilotbrowser is a high-level API to automate web browsers (Chromium, Firefox, and WebKit) with a single API, while also enabling fully autonomous AI agent browser control.

Unique to copilotbrowser is **"follow me" mode**: an AI agent can watch you navigate a website, learn the steps, and then replay them autonomously — including form fills, multi-step flows, and UI interactions.

## Supported Browsers

| Browser | Version |
|---------|---------|
| Chromium | <!-- GEN:chromium-version -->146.0.7680.0<!-- GEN:stop --> |
| Firefox | <!-- GEN:firefox-version -->146.0.1<!-- GEN:stop --> |
| WebKit | <!-- GEN:webkit-version -->26.0<!-- GEN:stop --> |

<!-- GEN:chromium-version-badge -->[![Chromium version](https://img.shields.io/badge/chromium-146.0.7680.0-blue.svg?logo=google-chrome)](https://www.chromium.org/Home)<!-- GEN:stop -->
<!-- GEN:firefox-version-badge -->[![Firefox version](https://img.shields.io/badge/firefox-146.0.1-blue.svg?logo=firefoxbrowser)](https://www.mozilla.org/en-US/firefox/new/)<!-- GEN:stop -->
<!-- GEN:webkit-version-badge -->[![WebKit version](https://img.shields.io/badge/webkit-26.0-blue.svg?logo=safari)](https://webkit.org/)<!-- GEN:stop -->

## Installation

```bash
npm install copilotbrowser
npx copilotbrowser install
```

The second command downloads the required browser binaries (Chromium, Firefox, WebKit).

### MCP Server Setup (AI Agent / Copilot)

To use copilotbrowser as an MCP tool for GitHub Copilot, Claude, or any MCP-compatible AI agent, add the following to your `.mcp.json`:

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

Supported `--browser` values: `msedge`, `chromium`, `firefox`, `webkit`.

### Developer Setup (from source)

```bash
git clone https://github.com/dayour/copilotbrowser
cd copilotbrowser
bash install.sh
```

or step by step:

```bash
npm ci
npm run build
npx copilotbrowser install
```

## Usage

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

## Documentation

See the [docs/](docs/) folder for full API documentation.

## License

[Apache 2.0](LICENSE)
