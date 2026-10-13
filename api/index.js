import { app } from '../src/app.js';
import { initDb } from '../src/database/db.js';

let isDbInitialized = false;

export default async function handler(req, res) {
  if (!isDbInitialized) {
    try {
      await initDb();
    } catch (err) {
      console.warn('Vercel serverless DB initialization warning:', err?.message || err);
    }
    isDbInitialized = true;
  }
  return app(req, res);
}
