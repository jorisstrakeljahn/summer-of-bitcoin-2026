#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-3000}"

cd "$SCRIPT_DIR/web"
echo "http://127.0.0.1:$PORT"
exec npx next dev -p "$PORT" 2>&1
