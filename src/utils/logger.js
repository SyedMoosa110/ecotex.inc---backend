const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const currentLevel = process.env.NODE_ENV === 'test' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;

function formatTimestamp() {
  return new Date().toISOString();
}

export const logger = {
  debug(...args) {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.log(`[${formatTimestamp()}] [DEBUG]`, ...args);
    }
  },
  info(...args) {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.log(`[${formatTimestamp()}] [INFO]`, ...args);
    }
  },
  warn(...args) {
    if (currentLevel <= LOG_LEVELS.WARN) {
      console.warn(`[${formatTimestamp()}] [WARN]`, ...args);
    }
  },
  error(...args) {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      console.error(`[${formatTimestamp()}] [ERROR]`, ...args);
    }
  },
};

export default logger;
