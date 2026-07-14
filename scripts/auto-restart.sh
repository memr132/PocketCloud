#!/usr/bin/env bash
# ==============================================================================
# PocketCloud Watchdog Loop for Termux
# Keeps the Node.js backend running 24/7. Automatically restarts on crash.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SERVER_DIR="$PROJECT_ROOT/server"

echo "[Watchdog] Starting PocketCloud server monitoring loop..."

cd "$SERVER_DIR" || exit 1

# Check if node is installed
if ! command -v node >/dev/null 2>&1; then
  echo "[Watchdog Error] Node.js is not installed or not in PATH."
  echo "Please install it in Termux with: pkg install nodejs"
  exit 1
fi

CRASH_COUNT=0
while true; do
  echo "[Watchdog] Launching Node.js server ($(date))..."
  node src/index.js
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo "[Watchdog] Server stopped gracefully."
    break
  else
    CRASH_COUNT=$((CRASH_COUNT + 1))
    echo "[Watchdog Warning] Server crashed with exit code $EXIT_CODE (Total crashes: $CRASH_COUNT)."
    echo "[Watchdog] Restarting in 3 seconds..."
    sleep 3
  fi
done
