const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ADMIN_PASSWORD_HASH, JWT_SECRET, STORAGE_ROOT } = require('../config');
const logger = require('../utils/logger');

function getUsersFilePath() {
  return path.join(STORAGE_ROOT, '.users.json');
}

function loadUsers() {
  const filePath = getUsersFilePath();
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return [];
  }
}

function saveUsers(users) {
  const filePath = getUsersFilePath();
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf8');
}

/**
 * Controller handling user authentication (`POST /api/auth/login`)
 */
async function login(req, res) {
  try {
    const { password, username } = req.body || {};

    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Password is required.'
      });
    }

    const cleanPassword = password.trim();
    const cleanHash = (ADMIN_PASSWORD_HASH || '').replace(/^['"]|['"]$/g, '').trim();
    const isOwnerMatch = await bcrypt.compare(cleanPassword, cleanHash);
    
    if (isOwnerMatch) {
      logger.info(`Successful owner login from IP: ${req.ip}`);
      const payload = {
        id: 'admin-tablet',
        username: 'Owner (Tablet Admin)',
        role: 'owner'
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({
        success: true,
        token,
        user: payload
      });
    }

    // Check Guest/Shared user accounts if owner password didn't match
    const users = loadUsers();
    for (const u of users) {
      if (u.passwordHash && await bcrypt.compare(cleanPassword, u.passwordHash)) {
        logger.info(`Successful guest login for user '${u.username}' from IP: ${req.ip}`);
        const payload = {
          id: u.username,
          username: u.username,
          role: 'guest'
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        return res.status(200).json({
          success: true,
          token,
          user: payload
        });
      }
    }

    logger.warn(`Failed login attempt from IP: ${req.ip}`);
    return res.status(401).json({
      success: false,
      error: 'Incorrect password.'
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

/**
 * Lists all non-owner users (`GET /api/auth/users`)
 */
function listUsers(req, res) {
  try {
    const users = loadUsers().map(u => ({
      username: u.username,
      role: u.role || 'guest',
      createdAt: u.createdAt
    }));
    return res.status(200).json({ success: true, users });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Creates a new guest/shared user (`POST /api/auth/users`)
 */
async function createUser(req, res) {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    const cleanUsername = username.trim();
    if (!cleanUsername || cleanUsername.toLowerCase() === 'owner' || cleanUsername.toLowerCase() === 'admin') {
      return res.status(400).json({ success: false, error: 'Invalid username.' });
    }

    const users = loadUsers();
    if (users.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'User already exists.' });
    }

    const passwordHash = await bcrypt.hash(password.trim(), 12);
    users.push({
      username: cleanUsername,
      role: 'guest',
      createdAt: new Date().toISOString(),
      passwordHash
    });

    saveUsers(users);
    return res.status(201).json({ success: true, message: `Guest user '${cleanUsername}' created successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Deletes a guest/shared user (`DELETE /api/auth/users/:username`)
 */
function deleteUser(req, res) {
  try {
    const { username } = req.params;
    let users = loadUsers();
    const initialLen = users.length;
    users = users.filter(u => u.username.toLowerCase() !== username.toLowerCase());

    if (users.length === initialLen) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    saveUsers(users);
    return res.status(200).json({ success: true, message: `User '${username}' deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  login,
  verifySession,
  listUsers,
  createUser,
  deleteUser
};
