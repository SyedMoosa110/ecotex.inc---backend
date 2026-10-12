import dns from 'dns';
import pg from 'pg';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// Ensure reliable public DNS resolution for cloud database endpoints
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (_) {}

const { Pool } = pg;
let pool = null;

/**
 * Returns or initializes PostgreSQL connection pool for Neon
 */
export function getPool() {
  if (!pool && config.databaseUrl) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected error on idle Neon PostgreSQL client:', err);
    });
  }
  return pool;
}

/**
 * Creates table schemas in Neon PostgreSQL
 */
export async function initNeonSchema() {
  const p = getPool();
  if (!p) throw new Error('Database pool not available');

  const client = await p.connect();
  try {
    await client.query('BEGIN');

    // 1. Primary Unified Collection Store (Fast JSONB store preserving 100% of schema & attributes)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ecotex_store (
        collection_name VARCHAR(64) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Individual Relational Tables with JSONB for direct SQL queries & indexing
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(128) PRIMARY KEY,
        name VARCHAR(255),
        category VARCHAR(128),
        in_stock BOOLEAN DEFAULT true,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(128) PRIMARY KEY,
        name VARCHAR(255),
        slug VARCHAR(128),
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(128) PRIMARY KEY,
        order_number VARCHAR(128),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        status VARCHAR(64),
        total_amount NUMERIC(12, 2),
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS quotes (
        id VARCHAR(128) PRIMARY KEY,
        contact_name VARCHAR(255),
        email VARCHAR(255),
        status VARCHAR(64),
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS customer_messages (
        id VARCHAR(128) PRIMARY KEY,
        customer_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(64),
        status VARCHAR(64),
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        id VARCHAR(64) PRIMARY KEY DEFAULT 'current',
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    logger.info('Neon PostgreSQL schemas and tables verified successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Failed to initialize Neon schema:', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Loads all collections from Neon PostgreSQL
 */
export async function loadAllCollectionsFromNeon() {
  const p = getPool();
  if (!p) return null;

  try {
    const res = await p.query('SELECT collection_name, data FROM ecotex_store');
    if (!res.rows || res.rows.length === 0) {
      return null;
    }

    const result = {};
    for (const row of res.rows) {
      result[row.collection_name] = row.data;
    }
    return result;
  } catch (err) {
    logger.error('Error fetching collections from Neon PostgreSQL:', err);
    return null;
  }
}

/**
 * Syncs a single collection to Neon PostgreSQL
 */
export async function saveCollectionToNeon(collectionName, data) {
  const p = getPool();
  if (!p) return;

  try {
    // 1. Update primary unified collection store (Immediate atomic write)
    await p.query(
      `INSERT INTO ecotex_store (collection_name, data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (collection_name)
       DO UPDATE SET data = $2, updated_at = NOW()`,
      [collectionName, JSON.stringify(data)]
    );

    // 2. Sync individual relational tables asynchronously in background (non-blocking for ultra-fast API response)
    (async () => {
      try {
        if (collectionName === 'products' && Array.isArray(data)) {
          for (const prod of data) {
            if (!prod || !prod.id) continue;
            await p.query(
              `INSERT INTO products (id, name, category, in_stock, data, updated_at)
               VALUES ($1, $2, $3, $4, $5, NOW())
               ON CONFLICT (id)
               DO UPDATE SET name = $2, category = $3, in_stock = $4, data = $5, updated_at = NOW()`,
              [prod.id, prod.name || '', prod.category || '', prod.inStock !== false, JSON.stringify(prod)]
            );
          }
        } else if (collectionName === 'orders' && Array.isArray(data)) {
          for (const ord of data) {
            if (!ord || !ord.id) continue;
            const total = parseFloat(ord.total || ord.pricing?.total || 0) || 0;
            await p.query(
              `INSERT INTO orders (id, order_number, customer_name, customer_email, status, total_amount, data, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
               ON CONFLICT (id)
               DO UPDATE SET order_number = $2, customer_name = $3, customer_email = $4, status = $5, total_amount = $6, data = $7, updated_at = NOW()`,
              [ord.id, ord.orderNumber || ord.id, ord.customer?.name || ord.customerName || '', ord.customer?.email || ord.customerEmail || '', ord.status || 'Pending', total, JSON.stringify(ord)]
            );
          }
        } else if (collectionName === 'quotes' && Array.isArray(data)) {
          for (const q of data) {
            if (!q || !q.id) continue;
            await p.query(
              `INSERT INTO quotes (id, contact_name, email, status, data, updated_at)
               VALUES ($1, $2, $3, $4, $5, NOW())
               ON CONFLICT (id)
               DO UPDATE SET contact_name = $2, email = $3, status = $4, data = $5, updated_at = NOW()`,
              [q.id, q.name || q.contactName || '', q.email || '', q.status || 'Pending', JSON.stringify(q)]
            );
          }
        } else if (collectionName === 'customerMessages' && Array.isArray(data)) {
          for (const msg of data) {
            if (!msg || !msg.id) continue;
            await p.query(
              `INSERT INTO customer_messages (id, customer_name, email, phone, status, data, updated_at)
               VALUES ($1, $2, $3, $4, $5, $6, NOW())
               ON CONFLICT (id)
               DO UPDATE SET customer_name = $2, email = $3, phone = $4, status = $5, data = $6, updated_at = NOW()`,
              [msg.id, msg.customerName || '', msg.email || '', msg.phone || '', msg.status || 'New', JSON.stringify(msg)]
            );
          }
        } else if (collectionName === 'settings' && data && typeof data === 'object') {
          await p.query(
            `INSERT INTO site_settings (id, data, updated_at)
             VALUES ('current', $1, NOW())
             ON CONFLICT (id)
             DO UPDATE SET data = $1, updated_at = NOW()`,
            [JSON.stringify(data)]
          );
        }
      } catch (syncErr) {
        logger.warn(`Background relational table sync error for ${collectionName}:`, syncErr.message || syncErr);
      }
    })();
  } catch (err) {
    logger.error(`Error saving collection "${collectionName}" to Neon PostgreSQL:`, err);
  }
}

/**
 * Migrates an entire object of collections into Neon PostgreSQL
 */
export async function saveAllCollectionsToNeon(allData) {
  if (!allData || typeof allData !== 'object') return;
  for (const [key, val] of Object.entries(allData)) {
    await saveCollectionToNeon(key, val);
  }
}

export default {
  getPool,
  initNeonSchema,
  loadAllCollectionsFromNeon,
  saveCollectionToNeon,
  saveAllCollectionsToNeon
};
