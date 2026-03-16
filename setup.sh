#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# setup.sh — Install project dependencies and decompress fixtures
#
# Prerequisites: Node.js >= 18, npm
#
# This script:
#   1. Installs npm dependencies for both root (CLI) and web/ (Next.js)
#   2. Decompresses .dat.gz fixture files in fixtures/ (if not already done)
#
# Run once before grading or development:
#   ./setup.sh
###############################################################################

# Install Node.js dependencies
echo "Installing root dependencies..."
npm install

echo "Installing web dependencies..."
(cd web && npm install)

# Decompress block fixtures if not already present
for gz in fixtures/*.dat.gz; do
  [ -f "$gz" ] || continue
  dat="${gz%.gz}"
  if [ ! -f "$dat" ]; then
    echo "Decompressing $(basename "$gz")..."
    gunzip -k "$gz"
  fi
done

echo "Setup complete"
