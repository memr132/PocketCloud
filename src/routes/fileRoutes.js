const express = require('express');
const router = express.Router();
const { authenticateToken, requireOwner } = require('../middleware/auth');
const {
  listDirectory,
  createFolder,
  renameItem,
  deleteItem,
  bulkDelete
} = require('../controllers/filesController');
const {
  uploadChunk,
  getUploadStatus,
  completeUpload,
  downloadFile,
  streamFile
} = require('../controllers/uploadController');

// All file and folder endpoints require JWT authentication
router.use(authenticateToken);

// Folder & File Management
router.get('/list', listDirectory);
router.post('/folder', createFolder);
router.put('/rename', requireOwner, renameItem);
router.delete('/delete', requireOwner, deleteItem);
router.post('/bulk-delete', requireOwner, bulkDelete);

// Chunked Resumable Uploads & Streaming Downloads
router.post('/upload/chunk', uploadChunk);
router.get('/upload/status', getUploadStatus);
router.post('/upload/complete', completeUpload);
router.get('/download', downloadFile);
router.get('/stream', streamFile);
router.get('/preview', streamFile);

module.exports = router;
