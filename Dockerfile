# =============================================================================
# copilotbrowser MCP Server - Docker Image
# Multi-stage build: builder compiles TypeScript; runtime runs headless Chromium
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder — install all deps and compile TypeScript
# -----------------------------------------------------------------------------
FROM node:25-bookworm-slim AS builder

WORKDIR /app

# Install native build tools (required by some npm packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Skip browser downloads in builder — browsers go into the runtime image only
ENV copilotbrowser_SKIP_BROWSER_DOWNLOAD=1

# Copy entire source tree (node_modules excluded by .dockerignore)
COPY . .

# Install all dependencies without running install/postinstall scripts
RUN npm ci --ignore-scripts

# Compile TypeScript across all workspace packages
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Runtime - minimal image with Chromium and production deps only
# -----------------------------------------------------------------------------
FROM node:25-bookworm-slim AS runtime

LABEL org.opencontainers.image.title="copilotbrowser MCP Server" \
      org.opencontainers.image.description="Browser automation MCP server — copilotbrowser" \
      org.opencontainers.image.version="2.0.0" \
      org.opencontainers.image.source="https://github.com/dayour/copilotbrowser" \
      org.opencontainers.image.licenses="Apache-2.0"

# Install Chromium system libraries required for headless operation
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libdbus-1-3 libexpat1 \
    libatspi2.0-0 libx11-6 libxcomposite1 libxdamage1 \
    libxext6 libxfixes3 libxrandr2 libgbm1 libxcb1 \
    libxkbcommon0 libpango-1.0-0 libcairo2 libasound2 \
    fonts-liberation fontconfig wget \
    && rm -rf /var/lib/apt/lists/* && fc-cache -fv

WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json ./

# Copy every package.json so npm can resolve the full workspace graph
COPY --from=builder /app/packages/copilotbrowser/package.json               packages/copilotbrowser/package.json
COPY --from=builder /app/packages/copilotbrowser-core/package.json          packages/copilotbrowser-core/package.json
COPY --from=builder /app/packages/copilotbrowser-chromium/package.json      packages/copilotbrowser-chromium/package.json
COPY --from=builder /app/packages/copilotbrowser-firefox/package.json       packages/copilotbrowser-firefox/package.json
COPY --from=builder /app/packages/copilotbrowser-webkit/package.json        packages/copilotbrowser-webkit/package.json
COPY --from=builder /app/packages/copilotbrowser-browser-chromium/package.json packages/copilotbrowser-browser-chromium/package.json
COPY --from=builder /app/packages/copilotbrowser-browser-firefox/package.json  packages/copilotbrowser-browser-firefox/package.json
COPY --from=builder /app/packages/copilotbrowser-browser-webkit/package.json   packages/copilotbrowser-browser-webkit/package.json
COPY --from=builder /app/packages/copilotbrowser-test/package.json          packages/copilotbrowser-test/package.json
COPY --from=builder /app/packages/copilotbrowser-client/package.json        packages/copilotbrowser-client/package.json
COPY --from=builder /app/packages/copilotbrowser-ct-core/package.json       packages/copilotbrowser-ct-core/package.json
COPY --from=builder /app/packages/copilotbrowser-ct-react/package.json      packages/copilotbrowser-ct-react/package.json
COPY --from=builder /app/packages/copilotbrowser-ct-react17/package.json    packages/copilotbrowser-ct-react17/package.json
COPY --from=builder /app/packages/copilotbrowser-ct-svelte/package.json     packages/copilotbrowser-ct-svelte/package.json
COPY --from=builder /app/packages/copilotbrowser-ct-vue/package.json        packages/copilotbrowser-ct-vue/package.json
COPY --from=builder /app/packages/html-reporter/package.json                packages/html-reporter/package.json
COPY --from=builder /app/packages/recorder/package.json                     packages/recorder/package.json
COPY --from=builder /app/packages/trace-viewer/package.json                 packages/trace-viewer/package.json
COPY --from=builder /app/packages/web/package.json                          packages/web/package.json
COPY --from=builder /app/packages/devtools/package.json                     packages/devtools/package.json
COPY --from=builder /app/packages/electron-app/package.json                 packages/electron-app/package.json
COPY --from=builder /app/packages/vscode-extension/package.json             packages/vscode-extension/package.json
COPY --from=builder /app/packages/chrome-extension/package.json             packages/chrome-extension/package.json

# Install production dependencies only (workspace links + external prod deps)
RUN npm ci --ignore-scripts --omit=dev

# Copy full built packages from builder (source + compiled lib/ output).
# Selective COPY is fragile — internal requires reference package roots,
# not just lib/, so copy entire package directories.
COPY --from=builder /app/packages/copilotbrowser      packages/copilotbrowser
COPY --from=builder /app/packages/copilotbrowser-core  packages/copilotbrowser-core
COPY --from=builder /app/packages/copilotbrowser-chromium packages/copilotbrowser-chromium

# Browser binaries are installed at container startup or via volume mount.
# copilotbrowser_BROWSERS_PATH controls where browsers are stored.
ENV copilotbrowser_BROWSERS_PATH=/ms-copilotbrowser

# Copy entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create non-root user for running the server
RUN groupadd -r copilotbrowser && useradd -r -g copilotbrowser -d /app -s /sbin/nologin copilotbrowser \
    && mkdir -p /ms-copilotbrowser \
    && chown -R copilotbrowser:copilotbrowser /app /ms-copilotbrowser

# Environment configuration with sensible defaults
ENV BROWSER_TYPE=chromium \
    BROWSER_HEADLESS=true \
    MCP_PORT=8931 \
    MCP_HOST=0.0.0.0 \
    SHARED_BROWSER_CONTEXT=false \
    NODE_ENV=production

# Expose MCP server port
EXPOSE 8931

# Health check against the /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- "http://localhost:${MCP_PORT}/health" || exit 1

USER copilotbrowser

ENTRYPOINT ["/entrypoint.sh"]
