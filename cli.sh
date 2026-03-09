#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# cli.sh — Bitcoin chain analysis CLI
#
# Usage:
#   ./cli.sh --block <blk.dat> <rev.dat> <xor.dat>
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec npx tsx "$SCRIPT_DIR/src/cli.ts" "$@"
