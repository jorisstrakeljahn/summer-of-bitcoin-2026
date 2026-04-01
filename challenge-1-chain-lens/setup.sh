#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# setup.sh — Install project dependencies
#
# This script is run once before grading to set up the environment.
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Decompress block fixtures if not already present
for gz in fixtures/blocks/*.dat.gz; do
  dat="${gz%.gz}"
  if [[ ! -f "$dat" ]]; then
    echo "Decompressing $(basename "$gz")..."
    gunzip -k "$gz"
  fi
done

# Install root dependencies (CLI + shared parsing library)
echo "Installing root dependencies..."
npm install

# Install web frontend dependencies
if [[ -d "web" && -f "web/package.json" ]]; then
  echo "Installing web dependencies..."
  cd web
  npm install
  echo "Building web frontend..."
  npm run build
  cd ..
fi

echo "Setup complete"
