#!/bin/zsh
# Copy live Mac data into this repo so you can commit it to GitHub.
set -euo pipefail

WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME="${PHD_OS_ROOT:-$HOME/phd-os}"

mkdir -p "$WORKSPACE/data"

if [[ -f "$RUNTIME/data/user-data.json" ]]; then
  cp "$RUNTIME/data/user-data.json" "$WORKSPACE/data/user-data.json"
  echo "✓ Copied ~/phd-os data → $WORKSPACE/data/user-data.json"
elif [[ -f "$WORKSPACE/data/user-data.json" ]]; then
  echo "✓ Using existing $WORKSPACE/data/user-data.json"
else
  echo "No user-data.json found. Edit locally first, or Import a backup in Settings."
  exit 1
fi

cd "$WORKSPACE"
git add -f data/user-data.json
echo ""
echo "Staged data/user-data.json (normally gitignored)."
echo "Next:"
echo "  git commit -m \"Backup PhD OS data\""
echo "  git push"
echo ""
echo "After push, Vercel redeploys. New browsers can load this snapshot;"
echo "further edits on the website still need Export → commit to sync back."
