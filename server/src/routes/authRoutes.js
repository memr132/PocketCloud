const express = require('express');
const router = express.Router();
const { login, verifySession } = require('../controllers/authController');
const loginRateLimiter = require('../middleware/rateLimiter');
const authenticateToken = require('../middleware/auth');

// POST /api/auth/login - Protected by express-rate-limit against brute-force attacks
router.post('/login', loginRateLimiter, login);

// GET /api/auth/verify - Protected by JWT auth middleware
router.get('/verify', authenticateToken, verifySession);

module.exports = router;
