import fs from 'fs';
import path from 'path';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import defaultData from './defaultData.js';

let memoryDb = null;
let writeQueue = Promise.resolve();

/**
 * Initializes database from disk or creates default seed
 */
export async function initDb() {
  try {
    if (!fs.existsSync(config.paths.dbFile)) {
      logger.info('Database file not found. Seeding initial database from defaults...');
      memoryDb = JSON.parse(JSON.stringify(defaultData));
      await writeToDiskAtomic(memoryDb);
      return memoryDb;
    }

    const raw = await fs.promises.readFile(config.paths.dbFile, 'utf-8');
    const parsed = JSON.parse(raw);

    // Validate essential collections
    memoryDb = {
      products: Array.isArray(parsed.products) ? parsed.products : defaultData.products,
      categories: Array.isArray(parsed.categories) ? parsed.categories : defaultData.categories,
      orders: Array.isArray(parsed.orders) ? parsed.orders : defaultData.orders,
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes : defaultData.quotes,
      settings: parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : defaultData.settings,
      testimonials: Array.isArray(parsed.testimonials) ? parsed.testimonials : defaultData.testimonials,
      adminAuth: parsed.adminAuth && typeof parsed.adminAuth === 'object' ? parsed.adminAuth : defaultData.adminAuth,
      customerMessages: Array.isArray(parsed.customerMessages) ? parsed.customerMessages : (defaultData.customerMessages || []),
    };

    logger.info(`Database initialized successfully. Collections: [products: ${memoryDb.products.length}, categories: ${memoryDb.categories.length}, orders: ${memoryDb.orders.length}, quotes: ${memoryDb.quotes.length}, messages: ${memoryDb.customerMessages.length}]`);

    // Create startup safety backup
    await backupDb();
    return memoryDb;
  } catch (err) {
    logger.error('Failed to parse database file, falling back to default seed:', err);
    memoryDb = JSON.parse(JSON.stringify(defaultData));
    await writeToDiskAtomic(memoryDb);
    return memoryDb;
  }
}

/**
 * Returns current snapshot of database
 */
export function getDb() {
  if (!memoryDb) {
    // Synchronous fallback read if called prior to async init
    try {
      if (fs.existsSync(config.paths.dbFile)) {
        const raw = JSON.parse(fs.readFileSync(config.paths.dbFile, 'utf-8'));
        memoryDb = {
          ...raw,
          customerMessages: Array.isArray(raw.customerMessages) ? raw.customerMessages : (defaultData.customerMessages || []),
        };
      } else {
        memoryDb = JSON.parse(JSON.stringify(defaultData));
      }
    } catch {
      memoryDb = JSON.parse(JSON.stringify(defaultData));
    }
  }
  return memoryDb;
}

/**
 * Atomic disk writer using a temporary file and atomic rename
 */
async function writeToDiskAtomic(data) {
  const content = JSON.stringify(data, null, 2);
  const tempPath = `${config.paths.dbFile}.tmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  try {
    await fs.promises.writeFile(tempPath, content, 'utf-8');
    try {
      await fs.promises.rename(tempPath, config.paths.dbFile);
    } catch (renameErr) {
      // Windows file lock fallback
      await fs.promises.copyFile(tempPath, config.paths.dbFile);
      await fs.promises.unlink(tempPath).catch(() => {});
    }
    return true;
  } catch (err) {
    logger.error('Error writing database to disk:', err);
    try {
      if (fs.existsSync(tempPath)) {
        await fs.promises.unlink(tempPath);
      }
    } catch (_) {}
    throw err;
  }
}

/**
 * Queued async database update to prevent race conditions
 */
export function saveDb(newData) {
  memoryDb = { ...memoryDb, ...newData };

  writeQueue = writeQueue
    .then(async () => {
      await writeToDiskAtomic(memoryDb);
    })
    .catch((err) => {
      logger.error('Write queue error:', err);
    });

  return writeQueue;
}

/**
 * Atomic updater function that executes against latest state
 */
export async function updateDb(updater) {
  return new Promise((resolve, reject) => {
    writeQueue = writeQueue
      .then(async () => {
        const current = getDb();
        const updated = await updater(current);
        if (updated) {
          memoryDb = updated;
        }
        await writeToDiskAtomic(memoryDb);
        resolve(memoryDb);
      })
      .catch((err) => {
        logger.error('Failed to update DB:', err);
        reject(err);
      });
  });
}

/**
 * Creates backup file
 */
export async function backupDb() {
  try {
    const current = getDb();
    await fs.promises.writeFile(config.paths.dbBackup, JSON.stringify(current, null, 2), 'utf-8');
    return true;
  } catch (err) {
    logger.warn('Failed to create database backup:', err);
    return false;
  }
}

/**
 * Resets database to factory defaults
 */
export async function resetDb() {
  await backupDb();
  memoryDb = JSON.parse(JSON.stringify(defaultData));
  await writeToDiskAtomic(memoryDb);
  logger.info('Database has been reset to factory defaults.');
  return memoryDb;
}

export default {
  initDb,
  getDb,
  saveDb,
  updateDb,
  backupDb,
  resetDb,
};
