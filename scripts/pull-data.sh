#!/bin/zsh
# Copy live always-on data back into this Cursor workspace for inspection.
set -euo pipefail
WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME="${PHD_OS_ROOT:-$HOME/phd-os}"
mkdir -p "$WORKSPACE/data"
if [[ -f "$RUNTIME/data/user-data.json" ]]; then
  cp "$RUNTIME/data/user-data.json" "$WORKSPACE/data/user-data.json"
  echo "Pulled $RUNTIME/data/user-data.json → $WORKSPACE/data/user-data.json"
else
  echo "No runtime data at $RUNTIME/data/user-data.json"
  exit 1
fi
