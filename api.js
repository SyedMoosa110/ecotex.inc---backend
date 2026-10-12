/**
 * Backward compatibility bridge for api.js
 * Re-exports the modern modular architecture from src/
 */
import { apiRouter } from './src/routes/index.js';
import { app as apiApp } from './src/app.js';
import { getDb as readDb, saveDb as writeDb } from './src/database/db.js';

export { apiRouter, apiApp, readDb, writeDb };
export default apiRouter;
