import { getDb } from '../database/db.js';
import logger from '../utils/logger.js';

export async function getStats(req, res) {
  try {
    const db = getDb();

    const products = db.products || [];
    const orders = db.orders || [];
    const quotes = db.quotes || [];
    const categories = db.categories || [];

    const totalProducts = products.length;
    const inStockProducts = products.filter((p) => p.inStock).length;
    const totalOrders = orders.length;
    const grossRevenue = orders.reduce((sum, o) => sum + (Number(o.total || o.totalAmount) || 0), 0);
    const totalQuotes = quotes.length;
    const pendingQuotes = quotes.filter((q) => q.status === 'New').length;
    const totalCategories = categories.length;
    const bagsDisplacedEstimate = 4500000 + Math.round(grossRevenue * 8);

    res.json({
      totalProducts,
      inStockProducts,
      totalOrders,
      grossRevenue,
      totalQuotes,
      pendingQuotes,
      totalCategories,
      bagsDisplacedEstimate,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error('Error computing dashboard statistics:', err);
    res.status(500).json({ error: 'Failed to compute dashboard stats' });
  }
}

export default {
  getStats,
};
