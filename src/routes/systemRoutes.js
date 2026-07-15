const express = require('express');
const router = express.Router();
const { authenticateToken, requireOwner } = require('../middleware/auth');
const { getSystemStats } = require('../controllers/systemController');

// System stats protected by authenticateToken + requireOwner
router.get('/stats', authenticateToken, requireOwner, getSystemStats);

module.exports = router;
