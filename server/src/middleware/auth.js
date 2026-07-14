const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');
const logger = require('../utils/logger');

/**
 * Express middleware to verify JSON Web Token (JWT) on protected endpoints.
 * Checks both Authorization header (`Bearer <token>`) and `?token=<token>` query parameter
 * (to enable browser native streaming downloads).
 */
function authenticateToken(req, res, next) {
  let token = null;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. No session token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn(`Failed token verification from IP ${req.ip}: ${err.message}`);
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired session token. Please log in again.'
    });
  }
}

module.exports = authenticateToken;
