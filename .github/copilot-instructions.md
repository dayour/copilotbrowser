# GitHub Copilot Instructions for copilotbrowser

## Browser MCP Command Rules (STRICT)

These rules apply whenever using any `mcp_copilotbrowse_browser_*` tool.

### One Command at a Time — No Exceptions

- **NEVER** chain or queue multiple `mcp_copilotbrowse_browser_*` calls in a single response.
- Issue **exactly one** browser MCP command per turn.
- **Wait for the result** of that command before deciding the next step.
- Do not pre-plan a sequence of browser commands and fire them all — the UI state after each action determines what comes next.

### Required Pattern

```
1. Issue ONE browser command
2. Read the result / snapshot
3. Confirm the action succeeded
4. Only then proceed with the next command in the next turn
```

### Prohibited Patterns

- Sending 2+ `mcp_copilotbrowse_browser_*` calls in one assistant turn.
- Issuing a `navigate` followed immediately by `click`, `type`, `snapshot`, etc. in the same turn.
- Retrying the same failed command more than once without user confirmation.
- Using `wait_for` as a substitute for checking actual UI state.

### Error Handling

- If a command fails, **stop and report** the error to the user. Do not attempt workarounds silently.
- If the browser is on a login page, **stop and ask** the user to log in manually. Do not proceed.
- If unsure whether an action succeeded, take a **single screenshot** and report the state before continuing.

### Why

Spamming browser commands causes unpredictable UI state, wasted actions on stale elements, and makes failures hard to debug. One command at a time keeps automation reliable and auditable.

---

## Planner Principles (Browser Exploration & Test Planning)

These rules apply when using copilotbrowser to explore an application or create a test plan, mirroring the `copilotbrowser-test-planner` agent methodology.

### 1. Setup Before Anything Else

- Always call the relevant setup tool (e.g., `planner_setup_page`) **once** before issuing any `browser_*` command.
- Never navigate or interact with the page before setup is confirmed.

### 2. Snapshot Over Screenshot

- Use `browser_snapshot` to observe page state — it is lighter, structured, and AI-readable.
- Use `browser_take_screenshot` **only when visual comparison is explicitly needed** (e.g., verifying a rendered image or layout).
- Never take a screenshot as a substitute for reading the accessibility snapshot.

### 3. Explore Before Acting

- After every navigation, call `browser_snapshot` to understand the current state before deciding the next action.
- Identify all interactive elements, forms, navigation paths, and dynamic regions before clicking anything.
- Do not assume the UI is in any particular state — always confirm first.

### 4. Analyze User Flows

- Before writing test steps or automation, map the primary user journeys through the feature.
- Consider multiple user types and their typical behaviors.
- Identify critical paths and potential failure points.

### 5. Design Comprehensive Scenarios

Every scenario or automation plan must cover:
- **Happy path** — normal, expected user behavior
- **Edge cases** — boundary conditions, empty states, max/min inputs
- **Error handling** — invalid input, network failure, permission denied

### 6. Structure Every Plan

Each scenario must include:
- A clear, descriptive title
- Step-by-step instructions specific enough for any engineer to follow
- Expected outcome for each step
- Starting state assumption (default: blank/fresh browser context)
- Success criteria and explicit failure conditions

### 7. Independence

- Write scenarios that can run in any order without depending on each other.
- Include negative testing (what should *not* happen) alongside positive cases.

### Why

The planner methodology prevents shallow automation that only tests the happy path. Systematic exploration and structured documentation catch regressions early and make test suites maintainable long-term.
