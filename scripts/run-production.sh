#!/bin/zsh
# Production runner — always executes from $HOME/phd-os (LaunchAgent-safe).
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
ROOT="${PHD_OS_ROOT:-$HOME/phd-os}"
export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-127.0.0.1}"

cd "$ROOT"
mkdir -p "$ROOT/logs" "$ROOT/data"

if [[ ! -d "$ROOT/node_modules" ]]; then
  echo "[phd-os] Installing dependencies…"
  npm install --no-audit --no-fund
fi

if [[ ! -d "$ROOT/.next" ]]; then
  echo "[phd-os] Building…"
  npm run build
fi

echo "[phd-os] Starting on http://${HOSTNAME}:${PORT}"
echo "[phd-os] Data file: $ROOT/data/user-data.json"
exec npx next start --hostname "$HOSTNAME" --port "$PORT"
