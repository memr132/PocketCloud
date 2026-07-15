const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { STORAGE_ROOT, JWT_SECRET } = require('../config');
const { resolveSafePath, getRelativePath } = require('../utils/pathSanitizer');
const logger = require('../utils/logger');

function getSharesFilePath() {
  const dataDir = path.resolve(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const newPath = path.join(dataDir, 'shares.json');
  // Migrate old file from STORAGE_ROOT if present
  const oldPath = path.join(STORAGE_ROOT, '.shares.json');
  if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
    try {
      fs.copyFileSync(oldPath, newPath);
      fs.unlinkSync(oldPath);
    } catch (e) {}
  }
  return newPath;
}

function loadShares() {
  const filePath = getSharesFilePath();
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return [];
  }
}

function saveShares(shares) {
  const filePath = getSharesFilePath();
  fs.writeFileSync(filePath, JSON.stringify(shares, null, 2), 'utf8');
}

/**
 * Creates a public share link (`POST /api/share/create`)
 */
async function createShare(req, res) {
  try {
    const { itemPath, expiresInHours, password } = req.body || {};
    if (!itemPath) {
      return res.status(400).json({ success: false, error: 'itemPath is required.' });
    }

    const absolutePath = resolveSafePath(itemPath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, error: 'File or folder not found.' });
    }

    const stats = fs.statSync(absolutePath);
    const shareId = 'sh_' + Math.random().toString(36).substring(2, 11);
    const passwordHash = password && password.trim() ? await bcrypt.hash(password.trim(), 10) : null;

    const shares = loadShares();
    const newShare = {
      shareId,
      path: getRelativePath(absolutePath),
      name: path.basename(absolutePath),
      isDirectory: stats.isDirectory(),
      createdAt: new Date().toISOString(),
      expiresAt: expiresInHours && Number(expiresInHours) > 0 ? new Date(Date.now() + Number(expiresInHours) * 3600000).toISOString() : null,
      passwordHash
    };

    shares.push(newShare);
    saveShares(shares);

    return res.status(201).json({
      success: true,
      share: {
        shareId: newShare.shareId,
        name: newShare.name,
        isDirectory: newShare.isDirectory,
        expiresAt: newShare.expiresAt,
        requiresPassword: !!newShare.passwordHash
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Lists all active share links (`GET /api/share/list`)
 */
function listShares(req, res) {
  try {
    const now = new Date();
    let shares = loadShares();
    shares = shares.filter(s => !s.expiresAt || new Date(s.expiresAt) > now);
    saveShares(shares);

    return res.status(200).json({
      success: true,
      shares: shares.map(s => ({
        shareId: s.shareId,
        path: s.path,
        name: s.name,
        isDirectory: s.isDirectory,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        requiresPassword: !!s.passwordHash
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Deletes a share link (`DELETE /api/share/:shareId`)
 */
function deleteShare(req, res) {
  try {
    const { shareId } = req.params;
    let shares = loadShares();
    const len = shares.length;
    shares = shares.filter(s => s.shareId !== shareId);
    if (shares.length === len) {
      return res.status(404).json({ success: false, error: 'Share link not found.' });
    }
    saveShares(shares);
    return res.status(200).json({ success: true, message: 'Share link revoked.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Public info endpoint for share link (`GET /api/share/:shareId/info`)
 */
function getShareInfo(req, res) {
  try {
    const { shareId } = req.params;
    const shares = loadShares();
    const share = shares.find(s => s.shareId === shareId);

    if (!share) {
      return res.status(404).json({ success: false, error: 'Share link not found or has been revoked.' });
    }

    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return res.status(410).json({ success: false, error: 'This share link has expired.' });
    }

    return res.status(200).json({
      success: true,
      share: {
        shareId: share.shareId,
        name: share.name,
        isDirectory: share.isDirectory,
        requiresPassword: !!share.passwordHash,
        expiresAt: share.expiresAt
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Verifies share password (`POST /api/share/:shareId/verify`)
 */
async function verifySharePassword(req, res) {
  try {
    const { shareId } = req.params;
    const { password } = req.body || {};
    const shares = loadShares();
    const share = shares.find(s => s.shareId === shareId);

    if (!share) {
      return res.status(404).json({ success: false, error: 'Share link not found.' });
    }

    if (share.passwordHash) {
      if (!password || !await bcrypt.compare(password.trim(), share.passwordHash)) {
        return res.status(401).json({ success: false, error: 'Incorrect share password.' });
      }
    }

    const token = jwt.sign({ shareId: share.shareId, path: share.path, role: 'share' }, JWT_SECRET, { expiresIn: '24h' });
    return res.status(200).json({ success: true, token });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Downloads/Streams shared file (`GET /api/share/:shareId/download`)
 */
function downloadSharedFile(req, res) {
  try {
    const { shareId } = req.params;
    const token = req.query.token || (req.headers.authorization ? req.headers.authorization.substring(7) : null);
    const shares = loadShares();
    const share = shares.find(s => s.shareId === shareId);

    if (!share) {
      return res.status(404).json({ success: false, error: 'Share link not found.' });
    }

    if (share.passwordHash) {
      if (!token) {
        return res.status(401).json({ success: false, error: 'Password verification required.' });
      }
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.shareId !== shareId) throw new Error('Token mismatch');
      } catch (err) {
        return res.status(403).json({ success: false, error: 'Invalid or expired share access token.' });
      }
    }

    const absolutePath = resolveSafePath(share.path);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, error: 'Shared file no longer exists.' });
    }

    const stats = fs.statSync(absolutePath);
    if (stats.isDirectory()) {
      return res.status(400).json({ success: false, error: 'Directory downloading coming soon.' });
    }

    const filename = path.basename(absolutePath);
    const contentType = require('mime-types').lookup(filename) || 'application/octet-stream';
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = end - start + 1;

      if (start >= stats.size || end >= stats.size) {
        res.status(416).set('Content-Range', `bytes */${stats.size}`);
        return res.end();
      }

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`
      });

      const fileStream = fs.createReadStream(absolutePath, { start, end });
      return fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stats.size,
        'Accept-Ranges': 'bytes',
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`
      });

      const fileStream = fs.createReadStream(absolutePath);
      return fileStream.pipe(res);
    }
  } catch (err) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = {
  createShare,
  listShares,
  deleteShare,
  getShareInfo,
  verifySharePassword,
  downloadSharedFile
};
