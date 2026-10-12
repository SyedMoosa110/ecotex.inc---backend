import logger from '../utils/logger.js';
import config from '../config/index.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: [${req.method}] ${req.originalUrl}`,
  });
}

export function errorHandler(err, req, res, next) {
  logger.error(`Unhandled Error [${req.method}] ${req.originalUrl}:`, err);

  const statusCode = err.statusCode || err.status || 500;
  const response = {
    success: false,
    error: err.message || 'Internal Server Error',
  };

  // Include stack only in local development
  if (config.env === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

export default {
  notFoundHandler,
  errorHandler,
};
