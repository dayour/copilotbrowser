# copilotbrowser — Copilot Studio Agent Builder

Autonomously create and configure Microsoft Copilot Studio agents from a JSON spec file using **copilotbrowser MCP** as the automation backbone.

## How It Works

```
spec.json  →  runner.mjs  →  copilotbrowser MCP  →  Copilot Studio UI  →  Live Agent
```

The automation drives the Copilot Studio UI programmatically:
1. Navigates to your Power Platform environment's Copilot Studio home
2. Creates a new agent from the natural-language `shortDescription` (Copilot AI bootstraps initial configuration)
3. Overwrites instructions with your full `instructions` field
4. Sets the AI model and web search toggle
5. Adds website knowledge sources
6. Optionally runs a validation test chat and captures the response

---

## Quick Start

### Prerequisites
- Edge browser with an active Copilot Studio login (authenticated Edge profile)
- Node.js ≥ 18
- copilotbrowser MCP compiled (run `npm run build` in `E:\copilotbrowser`)

### Install
```bash
cd examples/agent-builder
npm install
```

### Run
```bash
# Build a retail customer service agent
node runner.mjs specs/retail-customer-service.json

# Or via npm script
npm run build:helpdesk
```

The runner opens Edge, navigates to Copilot Studio, **pauses for you to log in if needed**, then runs the full automation.

---

## Spec File Format

See [`agent-spec.schema.json`](./agent-spec.schema.json) for the full JSON Schema.

```json
{
  "name": "My Agent",
  "shortDescription": "A concise 1-2 line description used as the NL creation prompt",
  "description": "Longer human-readable description",
  "instructions": "Full Markdown instructions for the agent...",
  "model": "GPT-4.1",
  "environment": {
    "id": "<power-platform-environment-guid>",
    "baseUrl": "https://copilotstudio.preview.microsoft.com"
  },
  "knowledge": {
    "webSearch": true,
    "websites": [
      "https://support.yourcompany.com"
    ]
  },
  "validation": {
    "testMessage": "What is your return policy?",
    "expectedKeywords": ["return", "days", "receipt"]
  }
}
```

### Key Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | ✓ | Agent display name |
| `shortDescription` | ✓ | NL prompt for Copilot AI to bootstrap the agent |
| `instructions` | — | Full Markdown instructions (overwrites AI-generated ones) |
| `model` | — | `GPT-4.1`, `GPT-4o`, `o1`, etc. |
| `environment.id` | ✓ | Power Platform environment GUID |
| `environment.baseUrl` | — | Defaults to production URL |
| `knowledge.webSearch` | — | Enable/disable web search (default: `true`) |
| `knowledge.websites` | — | Array of public website URLs to index as knowledge |
| `validation.testMessage` | — | Test message to validate agent works end-to-end |
| `validation.expectedKeywords` | — | Keywords that should appear in the test response |

---

## Sample Specs

| File | Use Case |
|------|----------|
| [`specs/retail-customer-service.json`](./specs/retail-customer-service.json) | E-commerce customer service, returns/orders, promotions |
| [`specs/it-helpdesk.json`](./specs/it-helpdesk.json) | IT support, password resets, hardware/software issues |
| [`specs/policy-guidance.json`](./specs/policy-guidance.json) | HR policy Q&A, benefits, compliance |

---

## Using `browser_run_code` Directly (via Copilot CLI)

If you're already in a Copilot CLI session with copilotbrowser active, you can inject the automation inline:

```
Read copilot-studio-creator.js, replace __SPEC__ with the retail spec, and call browser_run_code
```

The creator script is a self-contained `async (page) => { ... }` function — no `require()` calls, safe to inject directly.

---

## Architecture

```
runner.mjs
  ├── Reads spec JSON from CLI arg
  ├── Loads copilot-studio-creator.js and injects spec
  ├── Starts copilotbrowser MCP via StdioClientTransport
  │     └── node packages/copilotbrowser/cli.js run-mcp-server --browser msedge
  ├── Calls browser_navigate → Copilot Studio home
  ├── Pauses for human login if needed
  └── Calls browser_run_code → full copilotbrowser automation

copilot-studio-creator.js
  ├── Step 1: Navigate to home + dismiss welcome dialog
  ├── Step 2: NL creation via home page textbox
  ├── Step 3: Fill full instructions
  ├── Step 4: Set model via combobox
  ├── Step 5: Web Search toggle
  ├── Step 6: Save
  ├── Step 7: Add website knowledge sources
  └── Step 8: Validation test chat (optional)
  └── Returns: { success, agentId, agentUrl, name, testResponse, timestamp }
```

---

## Extending

**Add a new agent type:**
1. Copy an existing spec from `specs/`
2. Update `name`, `shortDescription`, `instructions`, and `knowledge`
3. Run `node runner.mjs specs/your-new-agent.json`

**Add new configuration steps:**
Edit `copilot-studio-creator.js` — add a new `// ── Step N ──` block following the existing pattern. The script uses `safeClick` / `safeFill` helpers that log warnings instead of throwing on failure, so the automation is resilient to UI changes.

**Integrate into CI/CD:**
The runner exits `0` on success, `1` on failure — ready for pipeline use once the browser session is pre-authenticated via `--storage-state`.
