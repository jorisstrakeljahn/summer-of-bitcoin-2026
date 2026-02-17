#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# web.sh — Bitcoin transaction web visualizer
#
# Starts the web visualizer server.
#
# Behavior:
#   - Reads PORT env var (default: 3000)
#   - Prints the URL (e.g., http://127.0.0.1:3000) to stdout
#   - Keeps running until terminated (CTRL+C / SIGTERM)
#   - Must serve GET /api/health -> 200 { "ok": true }
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-3000}"

cd "$SCRIPT_DIR/web"

# Auto-build if Next.js build output is missing
if [ ! -d ".next" ]; then
  npx next build >&2
fi

echo "http://127.0.0.1:${PORT}"
exec npx next start -p "$PORT"
