import process from 'process';
import config from '../config/index.js';
import { getDb } from '../database/db.js';

export function getHealth(req, res) {
  const memory = process.memoryUsage();
  const db = getDb();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: config.env,
    version: '1.0.0',
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
      },
    },
    database: {
      status: 'connected',
      provider: config.databaseUrl ? 'Neon PostgreSQL (Cloud)' : 'Local Atomic Store',
      type: 'PostgreSQL + High-Performance Unified Store',
      records: {
        products: db.products?.length || 0,
        categories: db.categories?.length || 0,
        orders: db.orders?.length || 0,
        quotes: db.quotes?.length || 0,
        testimonials: db.testimonials?.length || 0,
      },
    },
  });
}

export default {
  getHealth,
};
