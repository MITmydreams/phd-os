#!/bin/zsh
set -euo pipefail

LABEL="com.phdos.app"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
PORT="${PORT:-3000}"

launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
rm -f "$PLIST"

if command -v lsof >/dev/null; then
  PIDS="$(lsof -tiTCP:${PORT} -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${PIDS}" ]]; then
    kill ${PIDS} 2>/dev/null || true
  fi
fi

echo "PH.D. OS autostart removed. Server stopped."
echo "Runtime copy (if any) still at: $HOME/phd-os"
echo "Remove it manually if you want:  rm -rf ~/phd-os"
