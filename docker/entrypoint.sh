#!/bin/sh
# copilotbrowser MCP Server Docker Entrypoint
# Reads environment variables and constructs CLI arguments

set -e

# Default configuration (can be overridden via env vars)
BROWSER="${BROWSER_TYPE:-chromium}"
PORT="${MCP_PORT:-8931}"
HOST="${MCP_HOST:-0.0.0.0}"

# Build CLI argument list
ARGS="run-mcp-server"
ARGS="$ARGS --browser $BROWSER"
ARGS="$ARGS --port $PORT"
ARGS="$ARGS --host $HOST"
ARGS="$ARGS --headless"
ARGS="$ARGS --no-sandbox"
ARGS="$ARGS --isolated"

# Optional: shared browser context across HTTP clients
if [ "${SHARED_BROWSER_CONTEXT:-false}" = "true" ]; then
  ARGS="$ARGS --shared-browser-context"
fi

# Optional: additional capabilities (e.g. vision,pdf)
if [ -n "$BROWSER_CAPS" ]; then
  ARGS="$ARGS --caps $BROWSER_CAPS"
fi

# Optional: allowed hosts for host header validation
if [ -n "$ALLOWED_HOSTS" ]; then
  ARGS="$ARGS --allowed-hosts $ALLOWED_HOSTS"
fi

# Optional: viewport size
if [ -n "$VIEWPORT_SIZE" ]; then
  ARGS="$ARGS --viewport-size $VIEWPORT_SIZE"
fi

# Optional: output directory for traces/videos
if [ -n "$OUTPUT_DIR" ]; then
  ARGS="$ARGS --output-dir $OUTPUT_DIR"
fi

echo "Starting copilotbrowser MCP Server on $HOST:$PORT (browser: $BROWSER)"
exec copilotbrowser $ARGS "$@"
