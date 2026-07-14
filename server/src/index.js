const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { PORT, STORAGE_ROOT } = require('./config');
const logger = require('./utils/logger');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    storageRoot: STORAGE_ROOT
  });
});

// Serve Frontend SPA in Production / Termux Deployment Mode
const clientBuildPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  // SPA Fallback: send index.html for any non-API route
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    }
  });
} else {
  logger.info('Frontend build not found at /client/dist. API running in standalone mode.');
}

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error.'
  });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`=============================================================`);
    logger.info(`PocketCloud Server running on http://0.0.0.0:${PORT}`);
    logger.info(`Storage Root: ${STORAGE_ROOT}`);
    logger.info(`=============================================================`);
  });
}

module.exports = app;
