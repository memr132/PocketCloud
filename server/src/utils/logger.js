/**
 * Simple formatted logger for PocketCloud
 */

function formatMessage(level, message) {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

const logger = {
  info: (message) => console.log(formatMessage('info', message)),
  warn: (message) => console.warn(formatMessage('warn', message)),
  error: (message, err = null) => {
    console.error(formatMessage('error', message));
    if (err && err.stack) {
      console.error(err.stack);
    }
  },
  debug: (message) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(formatMessage('debug', message));
    }
  }
};

module.exports = logger;
