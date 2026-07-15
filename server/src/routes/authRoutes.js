const express = require('express');
const router = express.Router();
const { authenticateToken, requireOwner } = require('../middleware/auth');
const { login, verifySession, listUsers, createUser, deleteUser } = require('../controllers/authController');
const loginRateLimiter = require('../middleware/rateLimiter');

// POST /api/auth/login - Protected by express-rate-limit against brute-force attacks
router.post('/login', loginRateLimiter, login);

// GET /api/auth/verify - Protected by JWT auth middleware
router.get('/verify', authenticateToken, verifySession);

// User/Guest Management endpoints (Owner only)
router.get('/users', authenticateToken, requireOwner, listUsers);
router.post('/users', authenticateToken, requireOwner, createUser);
router.delete('/users/:username', authenticateToken, requireOwner, deleteUser);

module.exports = router;
