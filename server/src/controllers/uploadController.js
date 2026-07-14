const fs = require('fs');
const path = require('path');
const busboy = require('busboy');
const mime = require('mime-types');
const { resolveSafePath, sanitizeName, getRelativePath } = require('../utils/pathSanitizer');
const { CACHE_UPLOADS_DIR } = require('../config');
const logger = require('../utils/logger');

/**
 * Handles uploading a single chunk (`POST /api/files/upload/chunk`)
 * Streams chunk directly to disk via Busboy without memory buffering.
 */
function uploadChunk(req, res) {
  const bb = busboy({ headers: req.headers });
  const fields = {};
  let chunkFileStream = null;
  let chunkFilePath = null;
  let fileWritePromise = null;

  bb.on('field', (name, val) => {
    fields[name] = val;
  });

  bb.on('file', (name, file, info) => {
    // Ensure we know the uploadId and chunkIndex (sent before or handled safely via tmp)
    const uploadId = sanitizeName(fields.uploadId || `tmp_${Date.now()}_${Math.random().toString(36).substring(2)}`);
    const chunkIndex = parseInt(fields.chunkIndex || '0', 10);

    const uploadCacheFolder = path.join(CACHE_UPLOADS_DIR, uploadId);
    if (!fs.existsSync(uploadCacheFolder)) {
      fs.mkdirSync(uploadCacheFolder, { recursive: true });
    }

    chunkFilePath = path.join(uploadCacheFolder, `chunk_${chunkIndex}`);
    const writeStream = fs.createWriteStream(chunkFilePath);
    file.pipe(writeStream);

    fileWritePromise = new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  });

  bb.on('finish', async () => {
    try {
      if (fileWritePromise) {
        await fileWritePromise;
      }

      if (!fields.uploadId || fields.chunkIndex === undefined) {
        return res.status(400).json({ success: false, error: 'uploadId and chunkIndex fields are required.' });
      }

      return res.status(200).json({
        success: true,
        uploadId: fields.uploadId,
        chunkIndex: parseInt(fields.chunkIndex, 10)
      });
    } catch (err) {
      logger.error(`[Chunk Upload Error] ${err.message}`);
      return res.status(500).json({ success: false, error: 'Failed to write upload chunk to disk.' });
    }
  });

  bb.on('error', (err) => {
    logger.error(`[Busboy Error] ${err.message}`);
    return res.status(500).json({ success: false, error: 'Stream error during upload.' });
  });

  req.pipe(bb);
}

/**
 * Gets uploaded chunks status to enable instant resuming after connection drop (`GET /api/files/upload/status?uploadId=...`)
 */
function getUploadStatus(req, res) {
  try {
    const { uploadId } = req.query;
    if (!uploadId) {
      return res.status(400).json({ success: false, error: 'uploadId query parameter required.' });
    }

    const cleanUploadId = sanitizeName(uploadId);
    const uploadCacheFolder = path.join(CACHE_UPLOADS_DIR, cleanUploadId);

    if (!fs.existsSync(uploadCacheFolder)) {
      return res.status(200).json({ success: true, uploadedChunks: [] });
    }

    const files = fs.readdirSync(uploadCacheFolder);
    const uploadedChunks = files
      .filter((file) => file.startsWith('chunk_'))
      .map((file) => parseInt(file.split('_')[1], 10))
      .filter((idx) => !isNaN(idx))
      .sort((a, b) => a - b);

    return res.status(200).json({ success: true, uploadedChunks });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Merges all uploaded chunks into the final destination file (`POST /api/files/upload/complete`)
 */
async function completeUpload(req, res) {
  try {
    const { uploadId, filename, parentPath = '/', totalChunks } = req.body || {};

    if (!uploadId || !filename || totalChunks === undefined) {
      return res.status(400).json({ success: false, error: 'uploadId, filename, and totalChunks are required.' });
    }

    const cleanUploadId = sanitizeName(uploadId);
    const cleanFilename = sanitizeName(filename);
    const parentAbsolutePath = resolveSafePath(parentPath);
    const finalDestination = path.join(parentAbsolutePath, cleanFilename);

    // Verify safe target
    resolveSafePath(path.relative(resolveSafePath('/'), finalDestination));

    const uploadCacheFolder = path.join(CACHE_UPLOADS_DIR, cleanUploadId);
    if (!fs.existsSync(uploadCacheFolder)) {
      return res.status(404).json({ success: false, error: 'Chunk folder not found. Upload may have expired.' });
    }

    const total = parseInt(totalChunks, 10);
    for (let i = 0; i < total; i++) {
      const chunkPath = path.join(uploadCacheFolder, `chunk_${i}`);
      if (!fs.existsSync(chunkPath)) {
        return res.status(400).json({
          success: false,
          error: `Missing chunk_${i}. Cannot assemble incomplete upload.`
        });
      }
    }

    // Stream-append each chunk into destination to avoid buffer exhaustion
    const writeStream = fs.createWriteStream(finalDestination);

    for (let i = 0; i < total; i++) {
      const chunkPath = path.join(uploadCacheFolder, `chunk_${i}`);
      await new Promise((resolve, reject) => {
        const readStream = fs.createReadStream(chunkPath);
        readStream.pipe(writeStream, { end: false });
        readStream.on('end', resolve);
        readStream.on('error', reject);
      });
    }

    writeStream.end();
    await new Promise((resolve) => writeStream.on('finish', resolve));

    // Clean up temporary chunk folder
    fs.rmSync(uploadCacheFolder, { recursive: true, force: true });

    const stats = fs.statSync(finalDestination);
    logger.info(`Completed chunked upload: ${getRelativePath(finalDestination)} (${stats.size} bytes)`);

    return res.status(200).json({
      success: true,
      path: getRelativePath(finalDestination),
      size: stats.size,
      name: cleanFilename
    });
  } catch (err) {
    const status = err.status || 500;
    logger.error(`[Upload Complete Error] ${err.message}`);
    return res.status(status).json({ success: false, error: err.message });
  }
}

/**
 * Streams files for download with full HTTP Range request support (`206 Partial Content`)
 * (`GET /api/files/download?path=/large_video.mp4`)
 */
function downloadFile(req, res) {
  try {
    const filePath = req.query.path;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'path query parameter is required.' });
    }

    const absolutePath = resolveSafePath(filePath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, error: 'File not found.' });
    }

    const stats = fs.statSync(absolutePath);
    if (stats.isDirectory()) {
      return res.status(400).json({ success: false, error: 'Cannot download a folder directly. Select files.' });
    }

    const filename = path.basename(absolutePath);
    const contentType = mime.lookup(filename) || 'application/octet-stream';
    const range = req.headers.range;

    if (range) {
      // Parse Range header (e.g., "bytes=1000-2000")
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
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`
      });

      const fileStream = fs.createReadStream(absolutePath, { start, end });
      return fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stats.size,
        'Accept-Ranges': 'bytes',
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`
      });

      const fileStream = fs.createReadStream(absolutePath);
      return fileStream.pipe(res);
    }
  } catch (err) {
    const status = err.status || 500;
    if (!res.headersSent) {
      return res.status(status).json({ success: false, error: err.message });
    }
  }
}

module.exports = {
  uploadChunk,
  getUploadStatus,
  completeUpload,
  downloadFile
};
