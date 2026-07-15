const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_ATTEMPTS } = require('../config');
const logger = require('../utils/logger');

/**
 * Rate Limiter for Login Endpoint.
 * Blocks IP address after RATE_LIMIT_MAX_ATTEMPTS failed attempts within RATE_LIMIT_WINDOW_MS.
 */
const loginRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS, // Default: 15 minutes
  max: RATE_LIMIT_MAX_ATTEMPTS,   // Default: 5 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: `Too many login attempts from this IP. To protect the server, please try again after ${Math.ceil(RATE_LIMIT_WINDOW_MS / 60000)} minutes.`
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded on login endpoint from IP ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  }
});

module.exports = loginRateLimiter;
