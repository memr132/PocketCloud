# Termux Installation & Setup Guide for PocketCloud

This guide walks you through setting up an old or broken Android tablet as a dedicated 24/7 personal cloud storage server using **Termux**.

---

## 1. Prerequisites & Termux Installation

> [!IMPORTANT]
> Do **NOT** install Termux from the Google Play Store (the Play Store version is outdated and broken due to Android SDK restrictions). Instead, install the latest APK from **F-Droid** or the official **GitHub releases page**:
> - [F-Droid Termux Package](https://f-droid.org/en/packages/com.termux/)
> - [Termux GitHub Releases](https://github.com/termux/termux-app/releases)

---

## 2. Installing Required System Packages

Once Termux is installed and opened, run the following commands to update repositories and install Node.js, Git, curl, and Termux APIs:

```bash
# Update and upgrade existing packages
pkg update && pkg upgrade -y

# Install Node.js v20+ and NPM, Git, curl, and Termux API utilities
pkg install nodejs git curl termux-api -y
```

Verify your Node.js installation:
```bash
node -v
# Should output v18.x, v20.x, or v22.x
npm -v
```

---

## 3. Disabling Battery Optimization (24/7 Operation)

Android aggressively sleeps background apps to save battery. To ensure your tablet stays online 24/7 without disconnecting your ngrok tunnel or aborting large file transfers:

### Step A: Acquire CPU Wakelock in Termux
Run the command below (our `start-server.sh` script also runs this automatically each time):
```bash
termux-wake-lock
```
*(To release it later, run `termux-wake-unlock`).*

### Step B: Android OS Unrestricted Battery Setting
1. Open Android **Settings** on the tablet.
2. Go to **Apps** -> **See all apps** -> **Termux**.
3. Tap **Battery** -> Select **Unrestricted** (or "No optimization").
4. If prompted with a system popup saying "Allow background activity?", tap **Allow**.

### Step C: Keep Tablet Plugged In & Wi-Fi Active
- Keep your tablet plugged into a power adapter.
- In Android **Settings -> Wi-Fi -> Wi-Fi preferences**, ensure **Keep Wi-Fi on during sleep** is set to **Always** (on older Android versions) or disable "Wi-Fi power saving mode" in Developer Options.

---

## 4. Cloning & Initializing PocketCloud

Now, clone your PocketCloud repository inside Termux:

```bash
# Clone the repo (replace with your actual GitHub repo URL)
git clone https://github.com/YOUR_USERNAME/PocketCloud.git ~/PocketCloud
cd ~/PocketCloud

# Copy environment configuration
cp .env.example .env

# Generate a secure password hash for your admin login
node scripts/hash-password.js
# (Copy the generated ADMIN_PASSWORD_HASH output and paste it into your .env file)
```

---

## 5. Next Steps
- For connecting external SD card storage, see [SD Card & Storage Symlinking Guide](./sd-card-symlink.md).
- To configure and start your ngrok tunnel, see [Security & Ngrok Guide](./security.md) or run `bash scripts/start-server.sh`.
