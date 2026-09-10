#!/bin/zsh
# Sync this workspace → ~/phd-os and install a login LaunchAgent.
# macOS blocks LaunchAgents from reading ~/Desktop, so the always-on
# copy lives in $HOME/phd-os with a fixed URL: http://127.0.0.1:3000
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

WORKSPACE="$(cd "$(dirname "$0")/.." && pwd)"
RUNTIME="${PHD_OS_ROOT:-$HOME/phd-os}"
LABEL="com.phdos.app"
PLIST="$HOME/Library/LaunchAgents/${LABEL}.plist"
SUPPORT="$HOME/Library/Application Support/phd-os"
PORT="${PORT:-3000}"

chmod +x "$WORKSPACE/scripts/"*.sh
mkdir -p "$HOME/Library/LaunchAgents" "$SUPPORT" "$RUNTIME/logs"

echo "[phd-os] Syncing workspace → $RUNTIME"
rsync -a \
  --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude logs \
  --exclude '.git' \
  --exclude '.DS_Store' \
  "$WORKSPACE/" "$RUNTIME/"

# Prefer existing runtime data; otherwise copy from workspace
mkdir -p "$RUNTIME/data" "$WORKSPACE/data"
if [[ ! -f "$RUNTIME/data/user-data.json" && -f "$WORKSPACE/data/user-data.json" ]]; then
  cp "$WORKSPACE/data/user-data.json" "$RUNTIME/data/user-data.json"
  echo "[phd-os] Copied data/user-data.json into runtime"
fi

echo "[phd-os] Installing npm deps + building in runtime…"
cd "$RUNTIME"
npm install --no-audit --no-fund
npm run build

# Library-side entry (never points launchd at Desktop scripts)
cat > "$SUPPORT/run.sh" <<EOF
#!/bin/zsh
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:\$PATH"
export PHD_OS_ROOT="$RUNTIME"
export PORT="$PORT"
export HOSTNAME="127.0.0.1"
exec /bin/zsh "$RUNTIME/scripts/run-production.sh"
EOF
chmod +x "$SUPPORT/run.sh"

# Stop old agent / free port
launchctl bootout "gui/$(id -u)/${LABEL}" 2>/dev/null || true
if command -v lsof >/dev/null; then
  PIDS="$(lsof -tiTCP:${PORT} -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${PIDS}" ]]; then
    echo "[phd-os] Stopping process(es) on port ${PORT}"
    kill ${PIDS} 2>/dev/null || true
    sleep 1
  fi
fi

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>WorkingDirectory</key>
  <string>${RUNTIME}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>${SUPPORT}/run.sh</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PHD_OS_ROOT</key>
    <string>${RUNTIME}</string>
    <key>PORT</key>
    <string>${PORT}</string>
    <key>HOSTNAME</key>
    <string>127.0.0.1</string>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${RUNTIME}/logs/server.out.log</string>
  <key>StandardErrorPath</key>
  <string>${RUNTIME}/logs/server.err.log</string>
</dict>
</plist>
EOF

launchctl bootstrap "gui/$(id -u)" "$PLIST"
launchctl enable "gui/$(id -u)/${LABEL}" 2>/dev/null || true
launchctl kickstart -k "gui/$(id -u)/${LABEL}" 2>/dev/null || true

# wait until healthy
echo "[phd-os] Waiting for server…"
for i in {1..30}; do
  if /usr/bin/curl -s -m 2 -o /dev/null -w "" http://127.0.0.1:${PORT}/; then
    break
  fi
  sleep 1
done

CODE="$(/usr/bin/curl -s -m 5 -o /dev/null -w "%{http_code}" http://127.0.0.1:${PORT}/ || echo down)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  PH.D. OS is always on"
echo "  URL:   http://127.0.0.1:${PORT}"
echo "  Also:  http://localhost:${PORT}"
echo "  Data:  $RUNTIME/data/user-data.json"
echo "  Status check: HTTP ${CODE}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Bookmark that URL — no need for npm run dev."
echo "Starts at login. Stop with: npm run stop:autostart"
echo "After code changes in this folder, re-run: npm run start:autostart"
echo ""
