const fs = require('fs');
const path = require('path');
const { resolveSafePath, sanitizeName, getRelativePath } = require('../utils/pathSanitizer');
const { STORAGE_ROOT } = require('../config');
const logger = require('../utils/logger');

/**
 * Lists contents of a directory (`GET /api/files/list?path=/folder`)
 */
async function listDirectory(req, res) {
  try {
    const userPath = req.query.path || '/';
    const absolutePath = resolveSafePath(userPath);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success: false,
        error: `Folder not found: ${userPath}`
      });
    }

    const stats = fs.statSync(absolutePath);
    if (!stats.isDirectory()) {
      return res.status(400).json({
        success: false,
        error: `Path is not a directory: ${userPath}`
      });
    }

    const items = fs.readdirSync(absolutePath, { withFileTypes: true });
    const formattedItems = [];

    for (const item of items) {
      // Ignore hidden files / temporary chunk directories / internal metadata files
      if (
        item.name.startsWith('.') ||
        item.name === 'shares.json' ||
        item.name === 'users.json' ||
        item.name === '.shares.json' ||
        item.name === '.users.json'
      ) {
        continue;
      }

      const itemAbsolutePath = path.join(absolutePath, item.name);
      let itemStats;
      try {
        itemStats = fs.statSync(itemAbsolutePath);
      } catch (e) {
        // Skip broken symlinks or inaccessible files
        continue;
      }

      const isDirectory = item.isDirectory();
      const ext = isDirectory ? '' : path.extname(item.name).toLowerCase().replace('.', '');

      formattedItems.push({
        name: item.name,
        path: getRelativePath(itemAbsolutePath),
        isDirectory,
        size: isDirectory ? 0 : itemStats.size,
        modifiedAt: itemStats.mtime.toISOString(),
        extension: ext
      });
    }

    // Sort folders first, then files alphabetically
    formattedItems.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    return res.status(200).json({
      success: true,
      currentPath: getRelativePath(absolutePath),
      items: formattedItems
    });
  } catch (err) {
    const status = err.status || 500;
    logger.error(`[List Error] ${err.message}`);
    return res.status(status).json({
      success: false,
      error: err.message || 'Failed to list directory contents.'
    });
  }
}

/**
 * Creates a new folder (`POST /api/files/folder`)
 */
async function createFolder(req, res) {
  try {
    const { parentPath = '/', name } = req.body || {};
    if (!name) {
      return res.status(400).json({ success: false, error: 'Folder name is required.' });
    }

    const cleanName = sanitizeName(name);
    const parentAbsolutePath = resolveSafePath(parentPath);
    const newFolderPath = path.join(parentAbsolutePath, cleanName);

    // Verify the combined path is safe
    resolveSafePath(path.relative(STORAGE_ROOT, newFolderPath));

    if (fs.existsSync(newFolderPath)) {
      return res.status(409).json({ success: false, error: 'A folder or file with this name already exists.' });
    }

    fs.mkdirSync(newFolderPath, { recursive: true });
    logger.info(`Folder created: ${getRelativePath(newFolderPath)}`);

    return res.status(201).json({
      success: true,
      path: getRelativePath(newFolderPath),
      name: cleanName
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
}

/**
 * Renames a file or folder (`PUT /api/files/rename`)
 */
async function renameItem(req, res) {
  try {
    const { oldPath, newName } = req.body || {};
    if (!oldPath || !newName) {
      return res.status(400).json({ success: false, error: 'oldPath and newName are required.' });
    }

    const cleanNewName = sanitizeName(newName);
    const oldAbsolutePath = resolveSafePath(oldPath);

    if (oldAbsolutePath === path.resolve(STORAGE_ROOT)) {
      return res.status(400).json({ success: false, error: 'Cannot rename the root storage directory.' });
    }

    if (!fs.existsSync(oldAbsolutePath)) {
      return res.status(404).json({ success: false, error: 'Target item not found.' });
    }

    const parentDir = path.dirname(oldAbsolutePath);
    const newAbsolutePath = path.join(parentDir, cleanNewName);

    // Verify safety
    resolveSafePath(path.relative(STORAGE_ROOT, newAbsolutePath));

    if (fs.existsSync(newAbsolutePath)) {
      return res.status(409).json({ success: false, error: 'An item with the target name already exists.' });
    }

    fs.renameSync(oldAbsolutePath, newAbsolutePath);
    logger.info(`Renamed: ${getRelativePath(oldAbsolutePath)} -> ${getRelativePath(newAbsolutePath)}`);

    return res.status(200).json({
      success: true,
      oldPath: getRelativePath(oldAbsolutePath),
      newPath: getRelativePath(newAbsolutePath),
      newName: cleanNewName
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
}

/**
 * Deletes a single file or folder (`DELETE /api/files/delete`)
 */
async function deleteItem(req, res) {
  try {
    const itemPath = req.query.path || (req.body && req.body.path);
    if (!itemPath) {
      return res.status(400).json({ success: false, error: 'path is required for deletion.' });
    }

    const absolutePath = resolveSafePath(itemPath);
    if (absolutePath === path.resolve(STORAGE_ROOT)) {
      return res.status(403).json({ success: false, error: 'Cannot delete the root storage folder.' });
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ success: false, error: 'Item not found.' });
    }

    fs.rmSync(absolutePath, { recursive: true, force: true });
    logger.info(`Deleted item: ${getRelativePath(absolutePath)}`);

    return res.status(200).json({
      success: true,
      deletedPath: getRelativePath(absolutePath)
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, error: err.message });
  }
}

/**
 * Bulk deletion of multiple files or folders (`POST /api/files/bulk-delete`)
 */
async function bulkDelete(req, res) {
  try {
    const { paths } = req.body || {};
    if (!Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ success: false, error: 'paths array is required.' });
    }

    const deleted = [];
    const failed = [];

    for (const itemPath of paths) {
      try {
        const absolutePath = resolveSafePath(itemPath);
        if (absolutePath === path.resolve(STORAGE_ROOT)) {
          failed.push({ path: itemPath, error: 'Cannot delete root directory' });
          continue;
        }
        if (fs.existsSync(absolutePath)) {
          fs.rmSync(absolutePath, { recursive: true, force: true });
          deleted.push(getRelativePath(absolutePath));
        } else {
          failed.push({ path: itemPath, error: 'Item not found' });
        }
      } catch (e) {
        failed.push({ path: itemPath, error: e.message });
      }
    }

    logger.info(`Bulk delete executed: ${deleted.length} deleted, ${failed.length} failed.`);
    return res.status(200).json({
      success: true,
      deleted,
      failed
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  listDirectory,
  createFolder,
  renameItem,
  deleteItem,
  bulkDelete
};
