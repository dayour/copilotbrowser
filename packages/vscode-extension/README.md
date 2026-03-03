# copilotbrowser — Browser Automation & MCP for VS Code

Control Chrome, Firefox, Edge, and WebKit from **GitHub Copilot Chat** and any MCP-compatible AI assistant, directly from VS Code.

## Features

- **MCP Server** — Automatically registers copilotbrowser as an MCP server so Copilot Chat can navigate pages, click, type, screenshot, and more without any manual config.
- **Auto-config** — On activation, writes `.vscode/mcp.json` (and `.github/copilot/mcp.json` if the repo has a `.github/` folder) so the server is discovered by VS Code and GitHub Copilot out of the box.
- **Headed or headless** — Launch a visible browser window on your desktop or run silently in the background.
- **32 browser tools** — navigate, click, type, screenshot, observe, fill forms, run JavaScript, record interactions, manage tabs, and more.
- **Vision / PDF / DevTools** — Optional capability packs for richer AI interactions.
- **Test runner integration** — Run copilotbrowser tests, start the Trace Viewer, and launch the code recorder from the command palette or editor context menu.

## Getting Started

1. **Install the extension** (this package).
2. **Reload VS Code** — the extension activates automatically on startup.
3. **Open Copilot Chat** and ask it to use the browser:
   > *"Navigate to https://github.com/darbotlabs and take a screenshot"*

   Copilot will invoke `browser_navigate` → Edge opens on your desktop and navigates to the page.

> **Tip:** The first time a browser tool is called, VS Code may ask you to approve the MCP server. Click **Allow**.

## Configuration

| Setting | Default | Description |
|---|---|---|
| `copilotbrowser.mcp.browser` | `msedge` | Browser to use: `chromium`, `chrome`, `msedge`, `firefox`, `webkit` |
| `copilotbrowser.mcp.headless` | `false` | Run in headless mode (no visible window) |
| `copilotbrowser.mcp.capabilities` | `["vision"]` | Extra capabilities: `vision`, `pdf`, `devtools` |
| `copilotbrowser.mcp.extraArgs` | `[]` | Additional CLI arguments |
| `copilotbrowser.mcp.noSandbox` | `false` | Disable sandbox for browser processes |
| `copilotbrowser.mcp.profileMode` | `isolated` | `isolated` (clean temp profile) or `connected` (reuse your browser profile) |
| `copilotbrowser.mcp.connectedUserDataDir` | `""` | Path to browser user-data directory for Connected mode |
| `copilotbrowser.mcp.connectedProfile` | `""` | Edge/Chrome profile folder for Connected mode (e.g. `Default`, `Profile 1`) |
| `copilotbrowser.showBrowser` | `false` | Show browser during test runs |
| `copilotbrowser.reuseBrowser` | `true` | Reuse browser context between test runs |
| `copilotbrowser.env` | `{}` | Extra environment variables |
| `copilotbrowser.autoStart` | `true` | Automatically start the MCP server on VS Code startup |
| `copilotbrowser.autoConfigureMCP` | `true` | Automatically configure MCP settings on first activation |

## Commands

| Command | Description |
|---|---|
| `copilotbrowser: Install Browsers` | Download browser binaries |
| `copilotbrowser: Start MCP Server` | Start the MCP server |
| `copilotbrowser: Stop MCP Server` | Stop the MCP server |
| `copilotbrowser: Restart MCP Server` | Restart the MCP server |
| `copilotbrowser: Show MCP Server Status` | Show current server status |
| `copilotbrowser: Refresh MCP Server` | Re-register the MCP server with updated config |
| `copilotbrowser: Show MCP Server Configuration` | Quick-pick showing current server config |
| `copilotbrowser: Set Browser` | Choose which browser to use |
| `copilotbrowser: Toggle Headless Mode` | Toggle headless on/off |
| `copilotbrowser: Toggle No Sandbox` | Toggle browser sandbox on/off |
| `copilotbrowser: Set MCP Capabilities` | Choose enabled capabilities |
| `copilotbrowser: Toggle Auto Start` | Toggle auto-start on VS Code launch |
| `copilotbrowser: Toggle Profile Mode` | Switch between Isolated and Connected profile |
| `copilotbrowser: Select Connected Profile` | Pick an installed Edge/Chrome profile |
| `copilotbrowser: Run Tests` | Run copilotbrowser tests for the active spec file |
| `copilotbrowser: Record New Test` | Launch the codegen recorder |
| `copilotbrowser: Show Trace Viewer` | Open a trace file from test-results |
| `copilotbrowser: Open Inspector` | Launch the copilotbrowser inspector |
| `copilotbrowser: Install CLI Skills` | Install CLI skill definitions |

## MCP Config Files

On every activation (and whenever settings change), the extension writes:

- **`.vscode/mcp.json`** — VS Code 1.99+ native MCP discovery (stdio transport, no port needed)
- **`.github/copilot/mcp.json`** — GitHub Copilot repo-level config

These files are safe to commit — all paths are workspace-relative and portable across operating systems.

## Requirements

- VS Code 1.99+
- Node.js 18+ (for running the MCP server process)
- A Chromium, Edge, Firefox, or WebKit browser (installed via `copilotbrowser: Install Browsers`)

## License

Apache-2.0 © Daryl Yourk
