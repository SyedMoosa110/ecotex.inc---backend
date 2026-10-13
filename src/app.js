import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';

import config from './config/index.js';
import apiRouter from './routes/index.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorMiddleware.js';

export const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for flexible SPA and CDN assets
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: config.cors.origin === '*' ? true : config.cors.origin.split(','),
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  })
);

// HTTP request logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(config.isProduction ? 'combined' : 'dev'));
}

// Body parsers
app.use(express.json({ limit: `${config.upload.maxSizeMb}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${config.upload.maxSizeMb}mb` }));

// Global Rate Limiting
app.use(generalLimiter);

// Serve uploads statically
try {
  if (!fs.existsSync(config.paths.uploadsDir)) {
    fs.mkdirSync(config.paths.uploadsDir, { recursive: true });
  }
} catch (_) {}
app.use('/uploads', express.static(config.paths.uploadsDir));

// Fallback upload paths
const frontendPublicUploads = fs.existsSync(path.join(config.paths.root, '..', 'frontend', 'public', 'uploads'))
  ? path.join(config.paths.root, '..', 'frontend', 'public', 'uploads')
  : path.join(config.paths.root, '..', 'ecotex-inc-frontend', 'public', 'uploads');
if (fs.existsSync(frontendPublicUploads)) {
  app.use('/uploads', express.static(frontendPublicUploads));
}

// Mount Core API router under /api
app.use('/api', apiRouter);

// Serve Frontend SPA build if available
const distPath = fs.existsSync(config.paths.frontendDist)
  ? config.paths.frontendDist
  : config.paths.rootDist;

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // If dist does not exist yet
  app.get('/', (req, res) => {
    res.json({
      service: 'Ecotex Inc. Enterprise API Server',
      status: 'active',
      endpoints: '/api',
      documentation: '/api/health',
    });
  });
}

// 404 for unmatched /api routes
app.use('/api/*', notFoundHandler);

// Global Error Handler
app.use(errorHandler);

export default app;
