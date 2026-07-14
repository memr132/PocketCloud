const path = require('path');
const { STORAGE_ROOT } = require('../config');

/**
 * Resolves a user-provided relative path against STORAGE_ROOT and verifies
 * that the resulting absolute path stays strictly inside STORAGE_ROOT.
 * Blocks all path traversal attempts (e.g., ../../etc/passwd).
 *
 * @param {string} userPath - The path provided by the user/client API.
 * @returns {string} The absolute path verified to be inside STORAGE_ROOT.
 * @throws {Error} If path traversal or illegal access is detected.
 */
function resolveSafePath(userPath = '') {
  // Remove leading slashes/backslashes so path.resolve treats it as relative
  const cleanUserPath = String(userPath).replace(/^[/\\]+/, '');
  
  // Resolve against the exact STORAGE_ROOT
  const absoluteTarget = path.resolve(STORAGE_ROOT, cleanUserPath);
  
  // Verify that the absolute target starts exactly with STORAGE_ROOT + separator, or IS STORAGE_ROOT
  const normalizedRoot = path.resolve(STORAGE_ROOT);
  if (absoluteTarget !== normalizedRoot && !absoluteTarget.startsWith(normalizedRoot + path.sep)) {
    const err = new Error('Access Denied: Path traversal attack detected.');
    err.status = 403;
    throw err;
  }

  return absoluteTarget;
}

/**
 * Sanitizes a file or folder name during creation or rename operations.
 * Prevents slash insertion, null byte injection, and Windows/Linux reserved characters.
 *
 * @param {string} name - The raw filename or folder name to sanitize.
 * @returns {string} A clean, safe name.
 * @throws {Error} If the name is invalid or empty after sanitization.
 */
function sanitizeName(name = '') {
  const strName = String(name).trim();
  if (!strName || strName === '.' || strName === '..') {
    const err = new Error('Invalid file or folder name.');
    err.status = 400;
    throw err;
  }

  // Strip null bytes and illegal filesystem characters
  // Blocking: / \ : * ? " < > | and control characters (0x00-0x1F)
  const sanitized = strName.replace(/[\0\/\\:\*\?"<>\|]/g, '').replace(/[\x00-\x1F]/g, '').trim();

  if (!sanitized || sanitized === '.' || sanitized === '..') {
    const err = new Error('Name contains only illegal characters.');
    err.status = 400;
    throw err;
  }

  return sanitized;
}

/**
 * Converts an absolute filesystem path back to a clean relative path from STORAGE_ROOT
 * for API responses. Always uses forward slashes '/' for web compatibility.
 *
 * @param {string} absolutePath - The absolute path within STORAGE_ROOT.
 * @returns {string} The relative path starting with '/' or empty string for root.
 */
function getRelativePath(absolutePath) {
  const normalizedRoot = path.resolve(STORAGE_ROOT);
  const normalizedPath = path.resolve(absolutePath);

  if (normalizedPath === normalizedRoot) {
    return '/';
  }

  let rel = path.relative(normalizedRoot, normalizedPath);
  // Convert Windows backslashes to forward slashes
  rel = rel.replace(/\\/g, '/');
  return rel.startsWith('/') ? rel : '/' + rel;
}

module.exports = {
  resolveSafePath,
  sanitizeName,
  getRelativePath
};
