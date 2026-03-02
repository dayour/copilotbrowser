---
name: copilotbrowser-cli
description: Automates browser interactions for web testing, form filling, screenshots, and data extraction. Use when the user needs to navigate websites, interact with web pages, fill forms, take screenshots, test web applications, or extract information from web pages.
allowed-tools: Bash(copilotbrowser-cli:*)
---

# Browser Automation with copilotbrowser-cli

## Quick start

```bash
# open new browser
copilotbrowser-cli open
# navigate to a page
copilotbrowser-cli goto https://copilotbrowser.dev
# interact with the page using refs from the snapshot
copilotbrowser-cli click e15
copilotbrowser-cli type "page.click"
copilotbrowser-cli press Enter
# take a screenshot (rarely used, as snapshot is more common)
copilotbrowser-cli screenshot
# close the browser
copilotbrowser-cli close
```

## Commands

### Core

```bash
copilotbrowser-cli open
# open and navigate right away
copilotbrowser-cli open https://example.com/
copilotbrowser-cli goto https://copilotbrowser.dev
copilotbrowser-cli type "search query"
copilotbrowser-cli click e3
copilotbrowser-cli dblclick e7
copilotbrowser-cli fill e5 "user@example.com"
copilotbrowser-cli drag e2 e8
copilotbrowser-cli hover e4
copilotbrowser-cli select e9 "option-value"
copilotbrowser-cli upload ./document.pdf
copilotbrowser-cli check e12
copilotbrowser-cli uncheck e12
copilotbrowser-cli snapshot
copilotbrowser-cli snapshot --filename=after-click.yaml
copilotbrowser-cli eval "document.title"
copilotbrowser-cli eval "el => el.textContent" e5
copilotbrowser-cli dialog-accept
copilotbrowser-cli dialog-accept "confirmation text"
copilotbrowser-cli dialog-dismiss
copilotbrowser-cli resize 1920 1080
copilotbrowser-cli close
```

### Navigation

```bash
copilotbrowser-cli go-back
copilotbrowser-cli go-forward
copilotbrowser-cli reload
```

### Keyboard

```bash
copilotbrowser-cli press Enter
copilotbrowser-cli press ArrowDown
copilotbrowser-cli keydown Shift
copilotbrowser-cli keyup Shift
```

### Mouse

```bash
copilotbrowser-cli mousemove 150 300
copilotbrowser-cli mousedown
copilotbrowser-cli mousedown right
copilotbrowser-cli mouseup
copilotbrowser-cli mouseup right
copilotbrowser-cli mousewheel 0 100
```

### Save as

```bash
copilotbrowser-cli screenshot
copilotbrowser-cli screenshot e5
copilotbrowser-cli screenshot --filename=page.png
copilotbrowser-cli pdf --filename=page.pdf
```

### Tabs

```bash
copilotbrowser-cli tab-list
copilotbrowser-cli tab-new
copilotbrowser-cli tab-new https://example.com/page
copilotbrowser-cli tab-close
copilotbrowser-cli tab-close 2
copilotbrowser-cli tab-select 0
```

### Storage

```bash
copilotbrowser-cli state-save
copilotbrowser-cli state-save auth.json
copilotbrowser-cli state-load auth.json

# Cookies
copilotbrowser-cli cookie-list
copilotbrowser-cli cookie-list --domain=example.com
copilotbrowser-cli cookie-get session_id
copilotbrowser-cli cookie-set session_id abc123
copilotbrowser-cli cookie-set session_id abc123 --domain=example.com --httpOnly --secure
copilotbrowser-cli cookie-delete session_id
copilotbrowser-cli cookie-clear

# LocalStorage
copilotbrowser-cli localstorage-list
copilotbrowser-cli localstorage-get theme
copilotbrowser-cli localstorage-set theme dark
copilotbrowser-cli localstorage-delete theme
copilotbrowser-cli localstorage-clear

# SessionStorage
copilotbrowser-cli sessionstorage-list
copilotbrowser-cli sessionstorage-get step
copilotbrowser-cli sessionstorage-set step 3
copilotbrowser-cli sessionstorage-delete step
copilotbrowser-cli sessionstorage-clear
```

### Network

```bash
copilotbrowser-cli route "**/*.jpg" --status=404
copilotbrowser-cli route "https://api.example.com/**" --body='{"mock": true}'
copilotbrowser-cli route-list
copilotbrowser-cli unroute "**/*.jpg"
copilotbrowser-cli unroute
```

### DevTools

```bash
copilotbrowser-cli console
copilotbrowser-cli console warning
copilotbrowser-cli network
copilotbrowser-cli run-code "async page => await page.context().grantPermissions(['geolocation'])"
copilotbrowser-cli tracing-start
copilotbrowser-cli tracing-stop
copilotbrowser-cli video-start
copilotbrowser-cli video-stop video.webm
```

## Open parameters
```bash
# Use specific browser when creating session
copilotbrowser-cli open --browser=chrome
copilotbrowser-cli open --browser=firefox
copilotbrowser-cli open --browser=webkit
copilotbrowser-cli open --browser=msedge
# Connect to browser via extension
copilotbrowser-cli open --extension

# Use persistent profile (by default profile is in-memory)
copilotbrowser-cli open --persistent
# Use persistent profile with custom directory
copilotbrowser-cli open --profile=/path/to/profile

# Start with config file
copilotbrowser-cli open --config=my-config.json

# Close the browser
copilotbrowser-cli close
# Delete user data for the default session
copilotbrowser-cli delete-data
```

## Snapshots

After each command, copilotbrowser-cli provides a snapshot of the current browser state.

```bash
> copilotbrowser-cli goto https://example.com
### Page
- Page URL: https://example.com/
- Page Title: Example Domain
### Snapshot
[Snapshot](.copilotbrowser-cli/page-2026-02-14T19-22-42-679Z.yml)
```

You can also take a snapshot on demand using `copilotbrowser-cli snapshot` command.

If `--filename` is not provided, a new snapshot file is created with a timestamp. Default to automatic file naming, use `--filename=` when artifact is a part of the workflow result.

## Browser Sessions

```bash
# create new browser session named "mysession" with persistent profile
copilotbrowser-cli -s=mysession open example.com --persistent
# same with manually specified profile directory (use when requested explicitly)
copilotbrowser-cli -s=mysession open example.com --profile=/path/to/profile
copilotbrowser-cli -s=mysession click e6
copilotbrowser-cli -s=mysession close  # stop a named browser
copilotbrowser-cli -s=mysession delete-data  # delete user data for persistent session

copilotbrowser-cli list
# Close all browsers
copilotbrowser-cli close-all
# Forcefully kill all browser processes
copilotbrowser-cli kill-all
```

## Local installation

In some cases user might want to install copilotbrowser-cli locally. If running globally available `copilotbrowser-cli` binary fails, use `npx copilotbrowser-cli` to run the commands. For example:

```bash
npx copilotbrowser-cli open https://example.com
npx copilotbrowser-cli click e1
```

## Example: Form submission

```bash
copilotbrowser-cli open https://example.com/form
copilotbrowser-cli snapshot

copilotbrowser-cli fill e1 "user@example.com"
copilotbrowser-cli fill e2 "password123"
copilotbrowser-cli click e3
copilotbrowser-cli snapshot
copilotbrowser-cli close
```

## Example: Multi-tab workflow

```bash
copilotbrowser-cli open https://example.com
copilotbrowser-cli tab-new https://example.com/other
copilotbrowser-cli tab-list
copilotbrowser-cli tab-select 0
copilotbrowser-cli snapshot
copilotbrowser-cli close
```

## Example: Debugging with DevTools

```bash
copilotbrowser-cli open https://example.com
copilotbrowser-cli click e4
copilotbrowser-cli fill e7 "test"
copilotbrowser-cli console
copilotbrowser-cli network
copilotbrowser-cli close
```

```bash
copilotbrowser-cli open https://example.com
copilotbrowser-cli tracing-start
copilotbrowser-cli click e4
copilotbrowser-cli fill e7 "test"
copilotbrowser-cli tracing-stop
copilotbrowser-cli close
```

## Specific tasks

* **Request mocking** [references/request-mocking.md](references/request-mocking.md)
* **Running copilotbrowser code** [references/running-code.md](references/running-code.md)
* **Browser session management** [references/session-management.md](references/session-management.md)
* **Storage state (cookies, localStorage)** [references/storage-state.md](references/storage-state.md)
* **Test generation** [references/test-generation.md](references/test-generation.md)
* **Tracing** [references/tracing.md](references/tracing.md)
* **Video recording** [references/video-recording.md](references/video-recording.md)
