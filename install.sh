#!/usr/bin/env bash
# install.sh — Developer onboarding for copilotbrowser
# Sets up the full development environment from a fresh clone.
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

step() { echo -e "\n${GREEN}==> $*${NC}"; }
warn() { echo -e "${YELLOW}[warn]${NC} $*"; }
fail() { echo -e "${RED}[error]${NC} $*"; exit 1; }

# ── 1. Node.js version check ──────────────────────────────────────────────────
step "Checking Node.js version..."
if ! command -v node &>/dev/null; then
  fail "Node.js is not installed. Install Node.js 25 or later from https://nodejs.org"
fi

NODE_MAJOR=$(node -e "process.stdout.write(String(process.versions.node.split('.')[0]))")
if [ "$NODE_MAJOR" -lt 25 ]; then
  fail "Node.js 25 or later is required (found v$(node --version)). Install from https://nodejs.org"
fi
echo "  Node.js $(node --version) ✓"

# ── 2. Install npm workspace dependencies ────────────────────────────────────
step "Installing npm dependencies..."
npm ci

# ── 3. Build all packages ────────────────────────────────────────────────────
step "Building packages..."
npm run build

# ── 4. Install browser binaries ──────────────────────────────────────────────
step "Installing browser binaries..."
npx copilotbrowser install

# ── 5. Done ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}✅  copilotbrowser is ready!${NC}"
echo ""
echo "  Next steps:"
echo "    • Run tests:          npm test"
echo "    • Start MCP server:   node packages/copilotbrowser/cli.js run-mcp-server --browser msedge"
echo "    • Start CLI server:   node packages/copilotbrowser/cli.js run-cli-server"
echo "    • Watch / rebuild:    npm run watch"
echo ""
echo "  Add the MCP server to your editor by pointing to:"
echo "    packages/copilotbrowser/cli.js  run-mcp-server  --browser <msedge|chromium|firefox|webkit>"
echo ""
