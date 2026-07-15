const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Fallback to local .env if root .env not present
if (!process.env.STORAGE_ROOT && !process.env.PORT) {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
}

const PORT = parseInt(process.env.PORT || '8080', 10);
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$10$X7uB9q2P2S2oW0h5Z3k8uOQ.L9F4Q5Z3k8uOQ.L9F4Q5Z3k8uOQ.L9';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_pocketcloud_jwt_key_default';

// Resolve STORAGE_ROOT cleanly as an absolute path
const STORAGE_ROOT_RAW = process.env.STORAGE_ROOT || path.resolve(__dirname, '../../uploads');
const STORAGE_ROOT = path.resolve(STORAGE_ROOT_RAW);

// Temporary directory for receiving chunks during multi-GB uploads
const CACHE_UPLOADS_DIR = path.join(STORAGE_ROOT, '.cache_uploads');

// Ensure base directories exist on startup
try {
  if (!fs.existsSync(STORAGE_ROOT)) {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
  }
  if (!fs.existsSync(CACHE_UPLOADS_DIR)) {
    fs.mkdirSync(CACHE_UPLOADS_DIR, { recursive: true });
  }
} catch (error) {
  console.error(`[Config Error] Could not create storage root or cache directories: ${error.message}`);
}

const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes
const RATE_LIMIT_MAX_ATTEMPTS = parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '5', 10);

module.exports = {
  PORT,
  ADMIN_PASSWORD_HASH,
  JWT_SECRET,
  STORAGE_ROOT,
  CACHE_UPLOADS_DIR,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_ATTEMPTS
};
