#!/usr/bin/env bash
# ==============================================================================
# PocketCloud Stop Script
# Gracefully shuts down server loop, ngrok tunnel, and releases CPU wakelock.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_ROOT/.pocketcloud.pid"

echo "========================================================================"
echo "          Stopping PocketCloud Personal Cloud Storage Server            "
echo "========================================================================"

# 1. Kill recorded PIDs if PID file exists
if [ -f "$PID_FILE" ]; then
  echo "[1/3] Terminating recorded processes from .pocketcloud.pid..."
  while read -r pid; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "      Killing process PID: $pid"
      kill -9 "$pid" 2>/dev/null
    fi
  done < "$PID_FILE"
  rm -f "$PID_FILE"
else
  echo "[1/3] No .pocketcloud.pid file found."
fi

# 2. Kill any stray watchdog or node instances for PocketCloud
echo "[2/3] Cleaning up any remaining watchdog or node server processes..."
pkill -f "auto-restart.sh" 2>/dev/null
pkill -f "node src/index.js" 2>/dev/null
pkill -f "ngrok http" 2>/dev/null

# 3. Release Termux Wakelock
if command -v termux-wake-unlock >/dev/null 2>&1; then
  echo "[3/3] Releasing Android CPU Wakelock (termux-wake-unlock)..."
  termux-wake-unlock
  echo "      Wakelock released. Tablet normal power management restored."
else
  echo "[3/3] Notice: 'termux-wake-unlock' not found (skipped)."
fi

echo "========================================================================"
echo "          PocketCloud has been completely shut down.                    "
echo "========================================================================"
