# External SD Card & Storage Symlinking Guide

By default, PocketCloud stores all uploaded files and created folders in `./uploads` inside the project folder (`c:\Users\AKASH\Desktop\server\uploads` or `~/PocketCloud/uploads` on Termux).

If you want to use your tablet's **Internal Storage** or an **Micro SD Card** with multi-gigabyte/terabyte capacity, follow the steps below.

---

## 1. Grant Storage Access (`termux-setup-storage`)

In Termux, run:

```bash
termux-setup-storage
```

An Android system permission prompt will pop up asking: *"Allow Termux to access photos, media, and files on your device?"*  
Tap **Allow**.

This creates a `~/storage` directory inside your Termux home directory containing symlinks:
- `~/storage/shared` -> `/storage/emulated/0` (Internal Storage root / SD card partition 0)
- `~/storage/external-1` -> External physical SD Card (if present and mounted by Android)

---

## 2. Using Internal Storage for PocketCloud

To make PocketCloud save and serve files from a dedicated `PocketCloud` folder on your tablet's internal storage (`/sdcard/PocketCloud`):

1. Create the folder:
   ```bash
   mkdir -p ~/storage/shared/PocketCloud
   ```
2. Edit your `.env` file in the project root:
   ```env
   STORAGE_ROOT=/storage/emulated/0/PocketCloud
   ```
3. Restart PocketCloud (`bash scripts/start-server.sh`).

---

## 3. Using a Physical Micro SD Card (`Android/data/com.termux/files`)

Due to Android 11+ Scoped Storage restrictions, apps (including Termux) cannot write freely to the root of a physical external SD card (`/storage/XXXX-XXXX/`). However, Termux has **full, unrestricted read/write permission** inside its dedicated app directory on the SD card:

`/storage/<SD_CARD_ID>/Android/data/com.termux/files`

### Step A: Find Your SD Card ID
Run:
```bash
ls /storage/
```
You will see `emulated/`, `self/`, and a 9-character code like `1234-ABCD` or `9A8B-7C6D`. That code is your SD Card ID!

### Step B: Create a Directory on the SD Card
Run (replace `XXXX-XXXX` with your actual SD card ID):
```bash
mkdir -p /storage/XXXX-XXXX/Android/data/com.termux/files/PocketCloudStorage
```

### Step C: Create a Symlink inside PocketCloud (Optional for convenience)
```bash
cd ~/PocketCloud
ln -s /storage/XXXX-XXXX/Android/data/com.termux/files/PocketCloudStorage ./sdcard_storage
```

### Step D: Update `.env`
Open your `.env` file and set `STORAGE_ROOT` to the absolute SD card path:
```env
STORAGE_ROOT=/storage/XXXX-XXXX/Android/data/com.termux/files/PocketCloudStorage
```

When you start PocketCloud, all chunked multi-gigabyte uploads and downloads will directly read from and write to your physical micro SD card!
