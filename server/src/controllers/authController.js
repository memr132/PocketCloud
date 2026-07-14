const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ADMIN_PASSWORD_HASH, JWT_SECRET } = require('../config');
const logger = require('../utils/logger');

/**
 * Controller handling user authentication (`POST /api/auth/login`)
 */
async function login(req, res) {
  try {
    const { password } = req.body || {};

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Password is required.'
      });
    }

    const isMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!isMatch) {
      logger.warn(`Failed login attempt from IP: ${req.ip}`);
      return res.status(401).json({
        success: false,
        error: 'Incorrect password.'
      });
    }

    logger.info(`Successful admin login from IP: ${req.ip}`);

    // Issue a signed JWT token valid for 7 days
    const payload = {
      id: 'admin-tablet',
      username: 'admin',
      role: 'owner'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      success: true,
      token,
      user: payload
    });
  } catch (err) {
    logger.error('Error during login verification:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication.'
    });
  }
}

/**
 * Verifies active session token (`GET /api/auth/verify`)
 */
function verifySession(req, res) {
  return res.status(200).json({
    success: true,
    user: req.user
  });
}

module.exports = {
  login,
  verifySession
};
