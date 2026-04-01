#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# cli.sh — Bitcoin transaction / block analyzer CLI
#
# Usage:
#   ./cli.sh <fixture.json>                          Single-transaction mode
#   ./cli.sh --block <blk.dat> <rev.dat> <xor.dat>   Block mode
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

exec npx tsx "$SCRIPT_DIR/src/cli.ts" "$@"
