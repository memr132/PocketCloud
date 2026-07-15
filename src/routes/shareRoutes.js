const express = require('express');
const router = express.Router();
const { authenticateToken, requireOwner } = require('../middleware/auth');
const {
  createShare,
  listShares,
  deleteShare,
  getShareInfo,
  verifySharePassword,
  downloadSharedFile
} = require('../controllers/shareController');

// Public endpoints for access
router.get('/:shareId/info', getShareInfo);
router.post('/:shareId/verify', verifySharePassword);
router.get('/:shareId/download', downloadSharedFile);

// Owner protected management endpoints
router.post('/create', authenticateToken, requireOwner, createShare);
router.get('/list', authenticateToken, requireOwner, listShares);
router.delete('/:shareId', authenticateToken, requireOwner, deleteShare);

module.exports = router;
