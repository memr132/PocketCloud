# Security Hardening & Ngrok Tunneling Guide

PocketCloud exposes your tablet's local storage to the public internet via an **Ngrok HTTPS Tunnel**. Because real filesystem access is granted by this web app, understanding and maintaining security is critical.

---

## 1. Strong Password & Hash Generation

> [!WARNING]
> **Never commit your `.env` file or store plaintext passwords anywhere.**

Always generate your `ADMIN_PASSWORD_HASH` using our included bcrypt utility (`scripts/hash-password.js`). Choose a long, unpredictable passphrase (at least 12-16 characters with letters, numbers, and symbols).

If you ever suspect someone has gained access or guessed your password:
1. Immediately stop the server: `bash scripts/stop-server.sh`
2. Run `node scripts/hash-password.js new_strong_password`
3. Update `.env` with the new `ADMIN_PASSWORD_HASH`
4. Change `JWT_SECRET` in `.env` to invalidate all active login tokens immediately.

---

## 2. Ngrok Tunneling & URL Rotation

### Free Tier Behavior (Dynamic URLs)
By default, the ngrok Free Tier assigns a **random, ephemeral HTTPS URL** every time you restart the ngrok tunnel (e.g., `https://a1b2-3c4d-5e6f.ngrok-free.app`).
Our `scripts/start-server.sh` automatically queries local inspection `http://127.0.0.1:4040/api/tunnels` on boot and prints this new URL right in your terminal.

### Authtoken Rotation
If your `NGROK_AUTHTOKEN` or ngrok URL ever leaks to unauthorized parties:
1. Log into your [Ngrok Dashboard](https://dashboard.ngrok.com/tunnels/authtokens).
2. Revoke/reset your Authtoken.
3. Paste the new token into your `.env` file (`NGROK_AUTHTOKEN=...`).

### Upgrading to a Reserved Static Domain (Optional Paid Feature)
If you require a permanent, unchanging domain (e.g., `https://my-tablet.ngrok-free.app`), ngrok offers reserved domains on their basic/pro plans. To use a static domain in PocketCloud:
1. Reserve your domain in the ngrok dashboard.
2. Modify `scripts/start-server.sh` where ngrok is launched:
   ```bash
   ngrok http "$PORT" --domain=my-tablet.ngrok-free.app --log=false > "$LOG_DIR/ngrok.log" 2>&1 &
   ```

---

## 3. Built-In Security Architecture

PocketCloud incorporates multi-layered defense-in-depth security:

### A. Strict Path Sanitization (Anti-Traversal Protection)
Every API endpoint (`/api/files/*`) that reads, writes, renames, or deletes files routes user input through our hardened `pathSanitizer.js` engine.
- It normalizes and resolves paths against `STORAGE_ROOT` using Node's `path.resolve()`.
- If a malicious client sends `../../../../etc/passwd` or `/data/data/com.termux/files/home/.bashrc`, the path resolution check detects that the destination exits `STORAGE_ROOT` and throws an immediate `403 Access Denied: Path Traversal Detected` error.
- All null byte (`\0`) and illegal filename characters (`<`, `>`, `:`, `"`, `/`, `\`, `|`, `?`, `*`) are blocked on file/folder creation and rename.

### B. Brute-Force Rate Limiting (`express-rate-limit`)
To protect against automated brute-force password guessing over the public ngrok URL, the `/api/auth/login` endpoint is rate-limited:
- Maximum `5 failed attempts` per IP address within `15 minutes`.
- When triggered, requests are blocked with HTTP `429 Too Many Requests` (`"Too many login attempts. Please try again in 15 minutes."`).

### C. Signed JWT Bearer Authentication
Once logged in, clients receive a cryptographically signed JSON Web Token (`JWT`) via `Authorization: Bearer <token>`.
- Tokens expire automatically after `7 days`.
- No sensitive session data is stored in URLs or unencrypted storage.
