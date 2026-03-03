#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [[ $# -lt 1 ]]; then
  mkdir -p out
  echo '{"ok":false,"error":{"code":"INVALID_ARGS","message":"Usage: cli.sh <fixture.json>"}}' >&2
  exit 1
fi

exec npx tsx "$SCRIPT_DIR/src/cli.ts" "$@"
