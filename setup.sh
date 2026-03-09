#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# setup.sh — Install project dependencies and decompress fixtures
###############################################################################

# Install Node.js dependencies
echo "Installing dependencies..."
npm install

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
