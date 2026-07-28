# Browser Session Management

Run multiple isolated browser sessions concurrently with state persistence.

## Named Browser Sessions

Use `-s` flag to isolate browser contexts:

```bash
# Browser 1: Authentication flow
copilotbrowser-cli -s=auth open https://app.example.com/login

# Browser 2: Public browsing (separate cookies, storage)
copilotbrowser-cli -s=public open https://example.com

# Commands are isolated by browser session
copilotbrowser-cli -s=auth fill e1 "user@example.com"
copilotbrowser-cli -s=public snapshot
```

## Browser Session Isolation Properties

Each browser session has independent:
- Cookies
- LocalStorage / SessionStorage
- IndexedDB
- Cache
- Browsing history
- Open tabs

## Browser Session Commands

```bash
# List all browser sessions
copilotbrowser-cli list

# Stop a browser session (close the browser)
copilotbrowser-cli close                # stop the default browser
copilotbrowser-cli -s=mysession close   # stop a named browser

# Stop all browser sessions
copilotbrowser-cli close-all

# Forcefully kill all daemon processes (for stale/zombie processes)
copilotbrowser-cli kill-all

# Delete browser session user data (profile directory)
copilotbrowser-cli delete-data                # delete default browser data
copilotbrowser-cli -s=mysession delete-data   # delete named browser data
```

## Environment Variable

Set a default browser session name via environment variable:

```bash
export copilotbrowser_CLI_SESSION="mysession"
copilotbrowser-cli open example.com  # Uses "mysession" automatically
```

## Common Patterns

### Concurrent Scraping

```bash
#!/bin/bash
# Scrape multiple sites concurrently

# Start all browsers
copilotbrowser-cli -s=site1 open https://site1.com &
copilotbrowser-cli -s=site2 open https://site2.com &
copilotbrowser-cli -s=site3 open https://site3.com &
wait

# Take snapshots from each
copilotbrowser-cli -s=site1 snapshot
copilotbrowser-cli -s=site2 snapshot
copilotbrowser-cli -s=site3 snapshot

# Cleanup
copilotbrowser-cli close-all
```

### A/B Testing Sessions

```bash
# Test different user experiences
copilotbrowser-cli -s=variant-a open "https://app.com?variant=a"
copilotbrowser-cli -s=variant-b open "https://app.com?variant=b"

# Compare
copilotbrowser-cli -s=variant-a screenshot
copilotbrowser-cli -s=variant-b screenshot
```

### Persistent Profile

By default, browser profile is kept in memory only. Use `--persistent` flag on `open` to persist the browser profile to disk:

```bash
# Use persistent profile (auto-generated location)
copilotbrowser-cli open https://example.com --persistent

# Use persistent profile with custom directory
copilotbrowser-cli open https://example.com --profile=/path/to/profile
```

## Default Browser Session

When `-s` is omitted, commands use the default browser session:

```bash
# These use the same default browser session
copilotbrowser-cli open https://example.com
copilotbrowser-cli snapshot
copilotbrowser-cli close  # Stops default browser
```

## Browser Session Configuration

Configure a browser session with specific settings when opening:

```bash
# Open with config file
copilotbrowser-cli open https://example.com --config=.copilotbrowser/my-cli.json

# Open with specific browser
copilotbrowser-cli open https://example.com --browser=firefox

# Open in headed mode
copilotbrowser-cli open https://example.com --headed

# Open with persistent profile
copilotbrowser-cli open https://example.com --persistent
```

## Best Practices

### 1. Name Browser Sessions Semantically

```bash
# GOOD: Clear purpose
copilotbrowser-cli -s=github-auth open https://github.com
copilotbrowser-cli -s=docs-scrape open https://docs.example.com

# AVOID: Generic names
copilotbrowser-cli -s=s1 open https://github.com
```

### 2. Always Clean Up

```bash
# Stop browsers when done
copilotbrowser-cli -s=auth close
copilotbrowser-cli -s=scrape close

# Or stop all at once
copilotbrowser-cli close-all

# If browsers become unresponsive or zombie processes remain
copilotbrowser-cli kill-all
```

### 3. Delete Stale Browser Data

```bash
# Remove old browser data to free disk space
copilotbrowser-cli -s=oldsession delete-data
```
