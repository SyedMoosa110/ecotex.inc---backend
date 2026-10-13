import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootBackendDir = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(rootBackendDir, '.env') });

export const config = Object.freeze({
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_W3FynXtmqlc5@ep-sparkling-band-b4621xgb-pooler.c-6.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'ecotex_default_secret_key_change_me_in_prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15', 10) * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10),
    authMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '20', 10),
  },

  paths: {
    root: rootBackendDir,
    dbFile: process.env.VERCEL ? path.join('/tmp', 'db.json') : path.join(rootBackendDir, 'db.json'),
    dbBackup: process.env.VERCEL ? path.join('/tmp', 'db.backup.json') : path.join(rootBackendDir, 'db.backup.json'),
    uploadsDir: process.env.VERCEL ? path.join('/tmp', process.env.UPLOAD_DIRECTORY || 'uploads') : path.join(rootBackendDir, process.env.UPLOAD_DIRECTORY || 'uploads'),
    frontendDist: fs.existsSync(path.resolve(rootBackendDir, '..', 'frontend', 'dist'))
      ? path.resolve(rootBackendDir, '..', 'frontend', 'dist')
      : path.resolve(rootBackendDir, '..', 'ecotex-inc-frontend', 'dist'),
    rootDist: path.resolve(rootBackendDir, '..', 'dist'),
  },

  upload: {
    maxSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '25', 10),
    maxSizeBytes: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '25', 10) * 1024 * 1024,
    allowedMimeTypes: [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/svg+xml',
      'image/gif',
      'application/pdf'
    ]
  }
});

export default config;
