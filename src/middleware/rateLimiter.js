import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  skip: (req) => {
    // Skip rate limits in test environments or internal health checks
    return req.path === '/api/health' || process.env.NODE_ENV === 'test';
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

export const quotesLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Quote request rate limit exceeded. Please try again later or contact our sales hotline directly.',
  },
  skip: () => process.env.NODE_ENV === 'test',
});

export default {
  generalLimiter,
  authLimiter,
  quotesLimiter,
};
