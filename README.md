# PocketCloud: Personal Cloud Storage Server (Termux + Ngrok)

**PocketCloud** is a production-grade, self-hosted personal cloud storage web application built specifically to turn an old or broken Android tablet into a powerful 24/7 home storage server running entirely inside **Termux**. It features a genuine **Material Design 3 (Material You)** frontend, secure password-based authentication with rate limiting and signed JWT sessions, and a zero-buffer **chunked/resumable file transfer engine** capable of streaming multi-gigabyte files over an **ngrok** tunnel without crashing phone-grade hardware.

---

## Key Features

- **Material Design 3 (Material You)**: Authentic MD3 styling using `@mui/material` v6 design tokens, dynamic color palettes, pill-shaped navigation rails, floating action buttons (`FAB`), rounded dialogs, and real-time upload progress drawers.
- **Zero-Buffer Chunked Resumable Transfer**: Slices multi-gigabyte uploads into 5MB chunks (`File.slice()`) sequentially streamed to disk. Supports automatic resuming after connection drops, plus per-file pause, resume, and cancel controls.
- **Hardened Security Architecture**:
  - Bcrypt / Argon2 hashed admin password storage (`.env`).
  - Strict server-side path traversal resolution engine (`pathSanitizer.js`) blocking all `../` injection attempts.
  - Brute-force rate limiting (`express-rate-limit`) locking out excessive login attempts over public endpoints.
  - Signed JSON Web Token (`JWT`) session authentication.
- **Termux 24/7 Lifecycle Management**: Includes `termux-wake-lock` acquisition, an auto-restart watchdog loop (`auto-restart.sh`), and one-click startup scripts (`start-server.sh`, `stop-server.sh`) that extract and display your public ngrok URL banner automatically.

---

## Project Structure

```
PocketCloud/
├── server/                    # Node.js + Express API backend & chunked streaming engine
│   ├── src/
│   │   ├── controllers/       # Auth, File Manager, and Chunked Upload/Download controllers
│   │   ├── middleware/        # JWT Bearer auth & Brute-force rate limiter
│   │   ├── utils/             # Anti-traversal pathSanitizer & logger
│   │   ├── routes/
│   │   └── index.js           # Server entry point & static SPA file serving
│   └── tests/                 # Automated integration & security verification suite
├── client/                    # Vite + React + TypeScript + Material 3 single-page app
│   ├── src/
│   │   ├── components/        # MD3 TopBar, NavRail, Breadcrumbs, FileTable, UploadProgress
│   │   ├── theme/             # Material You tokens & Light/Dark/System theme provider
│   │   └── services/          # Resumable chunked upload client service & Axios interceptor
├── scripts/                   # Termux automation & management scripts
│   ├── start-server.sh        # Acquires wakelock, starts watchdog loop & ngrok, prints public URL
│   ├── stop-server.sh         # Gracefully stops server/ngrok and releases wakelock
│   ├── auto-restart.sh        # Watchdog crash recovery loop
│   └── hash-password.js       # CLI tool to generate bcrypt hash for your admin password
├── docs/                      # Comprehensive setup & troubleshooting guides
│   ├── termux-setup.md        # Termux installation, pkg requirements & Android battery config
│   ├── sd-card-symlink.md     # External SD card setup & termux-setup-storage guide
│   └── security.md            # Ngrok URL rotation, password security & traversal defense
├── .env.example               # Environment variables template
└── README.md
```

---

## 1. Step-by-Step Termux Installation & Setup

### Step A: Install Termux from F-Droid or GitHub
> [!WARNING]
> Do **NOT** install Termux from the Google Play Store (it is deprecated and will fail to install packages). Download the latest APK from [F-Droid](https://f-droid.org/en/packages/com.termux/) or [Termux GitHub Releases](https://github.com/termux/termux-app/releases).

### Step B: Install Required System Packages in Termux
Open Termux and run:
```bash
pkg update && pkg upgrade -y
pkg install nodejs git curl termux-api -y
```

### Step C: Clone PocketCloud & Install Dependencies
```bash
# Clone the repository (replace with your GitHub URL or copy local folder)
git clone https://github.com/YOUR_USERNAME/PocketCloud.git ~/PocketCloud
cd ~/PocketCloud

# Copy environment configuration
cp .env.example .env

# Install server dependencies
cd server && npm install && cd ..

# Build frontend SPA
cd client && npm install && npm run build && cd ..
```

---

## 2. Configuration (`.env`)

Generate a secure bcrypt hash for the password you want to use for admin login:
```bash
node scripts/hash-password.js your_super_secret_password
```
Copy the generated `ADMIN_PASSWORD_HASH=...` line and open your `.env` file (`nano .env`):

```env
# Server Port (Default: 8080)
PORT=8080

# Paste your generated bcrypt hash here:
ADMIN_PASSWORD_HASH=$2a$12$YOUR_GENERATED_HASH_HERE

# Generate a long random secret string for signing login tokens:
JWT_SECRET=replace_with_long_random_string_here_398472983

# Storage root directory (e.g., ./uploads or an external SD card symlink)
STORAGE_ROOT=./uploads

# Your Ngrok Authtoken from https://dashboard.ngrok.com/
NGROK_AUTHTOKEN=your_ngrok_authtoken_here
```

---

## 3. SD Card & External Storage Setup

To store multi-gigabyte files directly on your tablet's physical micro SD card:
1. Grant storage permission inside Termux:
   ```bash
   termux-setup-storage
   ```
2. Find your SD Card ID (`ls /storage/` -> e.g. `1234-ABCD`).
3. Create a directory inside Termux's unrestricted app folder on the SD card:
   ```bash
   mkdir -p /storage/XXXX-XXXX/Android/data/com.termux/files/PocketCloudStorage
   ```
4. Update `STORAGE_ROOT` in `.env`:
   ```env
   STORAGE_ROOT=/storage/XXXX-XXXX/Android/data/com.termux/files/PocketCloudStorage
   ```
*(For detailed guidance, see [docs/sd-card-symlink.md](./docs/sd-card-symlink.md)).*

---

## 4. Running the Server & Ngrok Tunnel

### Launch 24/7 Tunneled Server (`start-server.sh`)
Run the all-in-one startup script:
```bash
bash scripts/start-server.sh
```
This script automatically:
1. Acquires Android CPU wakelock (`termux-wake-lock`) so your tablet stays running when screen off.
2. Launches the auto-restart watchdog (`scripts/auto-restart.sh`) on port `8080`.
3. Starts the ngrok tunnel in the background.
4. Queries local inspection and prints out your live public HTTPS URL banner right in the terminal!

### Stopping the Server (`stop-server.sh`)
To cleanly shut down all watchdog loops, ngrok tunnels, and release the CPU wakelock:
```bash
bash scripts/stop-server.sh
```

---

## 5. Updating & Redeploying After `git pull`

Whenever you push changes or updates to your GitHub repository, updating your tablet takes only two steps:

```bash
cd ~/PocketCloud

# 1. Stop the running instance
bash scripts/stop-server.sh

# 2. Pull latest code and rebuild frontend
git pull
cd client && npm install && npm run build && cd ..
cd server && npm install && cd ..

# 3. Relaunch server & tunnel
bash scripts/start-server.sh
```

---

## 6. Keeping the Server Alive 24/7 (Android Power Optimization)

To prevent Android from putting Termux or Wi-Fi to sleep overnight:
1. **Unrestricted Battery Mode**: Go to Android **Settings -> Apps -> Termux -> Battery -> Unrestricted** (No optimization).
2. **Keep Wi-Fi On**: Go to **Settings -> Wi-Fi -> Wi-Fi Preferences -> Keep Wi-Fi on during sleep -> Always**.
3. **Power Adapter**: Keep the tablet plugged into a power charger on a desk or shelf.

---

## 7. Known Limitations

1. **Ngrok Free-Tier URL Rotation**: On the free tier, ngrok assigns a random HTTPS domain every time the ngrok process restarts. Check the terminal banner on `start-server.sh` or upgrade to an ngrok paid plan with a reserved static domain (`--domain=your-subdomain.ngrok-free.app`) if you need a permanent URL.
2. **Single-User Admin Design**: PocketCloud is designed for single-user personal cloud storage. All API endpoints require the single `ADMIN_PASSWORD_HASH` credentials.
3. **No Offline Client Sync Engine**: Unlike desktop Dropbox clients with background local file sync daemons, PocketCloud operates via web upload/download and browser drag-and-drop.
4. **Tablet Hardware Point of Failure**: Because data is hosted on your local Android device or micro SD card, ensure you maintain backups of irreplaceable personal files.

---

## Verification & Testing

To run the full automated server security and integration test suite:
```bash
cd server
npm test
```
All 10 verification tests check for path traversal blocking (`../../etc/passwd`), rate limiting lockouts, JWT token verification, chunked resumable upload assembly, and `Range` header partial content streaming.
