#!/usr/bin/env bash
# ==============================================================================
# PocketCloud All-In-One Startup Script (Termux + Ngrok)
# Acquires Android CPU wakelock, starts Node.js backend loop, and opens ngrok tunnel.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_ROOT/.pocketcloud.pid"
LOG_DIR="$PROJECT_ROOT/logs"

mkdir -p "$LOG_DIR"

echo "========================================================================"
echo "          Starting PocketCloud Personal Cloud Storage Server            "
echo "========================================================================"

# 1. Check & Acquire Termux Wakelock
if command -v termux-wake-lock >/dev/null 2>&1; then
  echo "[1/5] Acquiring Android CPU Wakelock (termux-wake-lock)..."
  termux-wake-lock
  echo "      Wakelock acquired. Tablet will not sleep while running."
else
  echo "[1/5] Notice: 'termux-wake-lock' command not found."
  echo "      If running in Termux, install termux-api (`pkg install termux-api`) for 24/7 reliability."
fi

# 2. Check Environment Configuration (.env)
cd "$PROJECT_ROOT" || exit 1
if [ ! -f "$PROJECT_ROOT/.env" ]; then
  if [ -f "$PROJECT_ROOT/.env.example" ]; then
    echo "[2/5] No .env file found. Copying from .env.example..."
    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
    echo "      IMPORTANT: Please edit .env to set your secure password hash and ngrok authtoken!"
  else
    echo "[Error] Neither .env nor .env.example exists in $PROJECT_ROOT."
    exit 1
  fi
else
  echo "[2/5] Verified .env configuration file found."
fi

# Load environment variables (exporting them for ngrok and server)
set -a
source "$PROJECT_ROOT/.env"
set +a

PORT=${PORT:-8080}

# 3. Stop any existing running instance
if [ -f "$PID_FILE" ]; then
  echo "[3/5] Stopping previously running instances..."
  bash "$SCRIPT_DIR/stop-server.sh" >/dev/null 2>&1
else
  echo "[3/5] Checking existing processes..."
fi

# 4. Start Node.js Backend Loop in Background
echo "[4/5] Starting Node.js backend watchdog loop on port $PORT..."
bash "$SCRIPT_DIR/auto-restart.sh" > "$LOG_DIR/server.log" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

# Give the server 2 seconds to boot
sleep 2

# Verify server is listening
if ! curl -s "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1 && ! curl -s "http://127.0.0.1:$PORT/" >/dev/null 2>&1; then
  echo "      Notice: Server process launched (PID: $SERVER_PID). Check $LOG_DIR/server.log for details."
else
  echo "      Local server is live at http://127.0.0.1:$PORT"
fi

# 5. Start Ngrok Tunnel
echo "[5/5] Starting Ngrok HTTPS Tunnel to port $PORT..."
if ! command -v ngrok >/dev/null 2>&1; then
  echo "      [Warning] 'ngrok' command not found in PATH."
  echo "      To install ngrok in Termux:"
  echo "        1. Download ARM64 binaries or use: pkg install ngrok (if available)"
  echo "        2. Run: ngrok config add-authtoken <your_token>"
  echo "      Server is currently running locally only on http://127.0.0.1:$PORT"
else
  # Apply authtoken if present in .env
  if [ -n "$NGROK_AUTHTOKEN" ] && [ "$NGROK_AUTHTOKEN" != "your_ngrok_auth_token_here" ]; then
    ngrok config add-authtoken "$NGROK_AUTHTOKEN" >/dev/null 2>&1
  fi

  # Launch ngrok in background with API enabled on port 4040
  ngrok http "$PORT" --log=false > "$LOG_DIR/ngrok.log" 2>&1 &
  NGROK_PID=$!
  echo " $NGROK_PID" >> "$PID_FILE"

  echo "      Waiting for ngrok to establish tunnel..."
  sleep 4

  # Query ngrok local inspection API to get the public HTTPS URL
  NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'https://[a-zA-Z0-9.\-]*\.ngrok-free\.app' | head -n 1)
  if [ -z "$NGROK_URL" ]; then
    NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'https://[a-zA-Z0-9.\-]*\.ngrok\.[a-z]*' | head -n 1)
  fi

  if [ -n "$NGROK_URL" ]; then
    echo ""
    echo "========================================================================"
    echo "   POCKETCLOUD IS ONLINE & TUNNELED VIA NGROK!"
    echo "   Public URL: $NGROK_URL"
    echo "   Local URL:  http://127.0.0.1:$PORT"
    echo "   Logs:       $LOG_DIR/server.log"
    echo "========================================================================"
    echo "To stop the server and release Termux wakelock, run:"
    echo "  bash scripts/stop-server.sh"
    echo "========================================================================"
  else
    echo "      [Notice] Ngrok started (PID: $NGROK_PID), but could not immediately query tunnel URL."
    echo "      Check http://127.0.0.1:4040/ status dashboard or $LOG_DIR/ngrok.log."
  fi
fi
