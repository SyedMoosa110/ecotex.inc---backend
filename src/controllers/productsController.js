import { getDb, updateDb } from '../database/db.js';
import logger from '../utils/logger.js';

export async function getAllProducts(req, res) {
  try {
    const db = getDb();
    let products = [...(db.products || [])];

    // Filter by category
    const { category, search, inStock } = req.query;
    if (category && category !== 'all') {
      products = products.filter(
        (p) => String(p.category).toLowerCase() === String(category).toLowerCase()
      );
    }

    // Filter by search keyword
    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.material && p.material.toLowerCase().includes(q)) ||
          (p.categoryLabel && p.categoryLabel.toLowerCase().includes(q))
      );
    }

    // Filter by inStock
    if (inStock !== undefined) {
      const isStockTrue = inStock === 'true' || inStock === true;
      products = products.filter((p) => p.inStock === isStockTrue);
    }

    res.json(products);
  } catch (err) {
    logger.error('Error fetching products:', err);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
}

export async function getProductById(req, res) {
  try {
    const db = getDb();
    const product = db.products?.find((p) => p.id === req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve product' });
  }
}

export async function createProduct(req, res) {
  try {
    const body = req.body || {};
    const name = (body.name || '').trim();

    if (!name) {
      return res.status(400).json({ error: 'Product name is required.' });
    }

    const pricePerUnit = Number(body.pricePerUnit) || 0.25;
    const moq = Number(body.moq) || 500;

    const newProduct = {
      id: body.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      category: body.category || 'non-woven',
      categoryLabel: body.categoryLabel || 'Non-Woven Totes',
      subtitle: body.subtitle || '',
      pricePerUnit,
      moq,
      gsm: Number(body.gsm) || 80,
      dimensions: body.dimensions || '12"W x 15"H',
      material: body.material || 'Virgin Polypropylene',
      capacity: body.capacity || 'Up to 25 lbs',
      badge: body.badge || 'New Model',
      image: body.image || '/images/bag-green.png',
      inStock: body.inStock !== false,
      description: body.description || '',
      availableColors: Array.isArray(body.availableColors) && body.availableColors.length > 0
        ? body.availableColors
        : [{ name: 'Ecotex Forest', hex: '#166534' }],
      volumeTiers: Array.isArray(body.volumeTiers) && body.volumeTiers.length > 0
        ? body.volumeTiers
        : [{ minQty: moq, price: pricePerUnit }],
      features: Array.isArray(body.features) ? body.features : [],
      certifications: Array.isArray(body.certifications) ? body.certifications : ['GRS Certified', '100% Recyclable'],
      leadTime: body.leadTime || '2-3 Weeks',
      bestFor: body.bestFor || 'Retail, Supermarkets & Wholesale Distribution',
      ecoImpact: body.ecoImpact || 'Replaces 500+ single-use plastic bags over lifetime.',
      createdAt: new Date().toISOString(),
    };

    await updateDb((db) => {
      db.products = db.products || [];
      db.products.unshift(newProduct);
      return db;
    });

    res.status(201).json(newProduct);
  } catch (err) {
    logger.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    let updatedItem = null;

    await updateDb((db) => {
      const idx = db.products?.findIndex((p) => p.id === id);
      if (idx === -1 || idx === undefined) {
        return db;
      }

      const existing = db.products[idx];
      updatedItem = {
        ...existing,
        ...req.body,
        id, // Keep immutable ID
        pricePerUnit: req.body.pricePerUnit !== undefined ? Number(req.body.pricePerUnit) : existing.pricePerUnit,
        moq: req.body.moq !== undefined ? Number(req.body.moq) : existing.moq,
        gsm: req.body.gsm !== undefined ? Number(req.body.gsm) : existing.gsm,
        updatedAt: new Date().toISOString(),
      };

      db.products[idx] = updatedItem;
      return db;
    });

    if (!updatedItem) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(updatedItem);
  } catch (err) {
    logger.error('Error updating product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
}

export async function toggleStock(req, res) {
  try {
    const { id } = req.params;
    let updatedItem = null;

    await updateDb((db) => {
      const idx = db.products?.findIndex((p) => p.id === id);
      if (idx === -1 || idx === undefined) {
        return db;
      }

      db.products[idx].inStock = !db.products[idx].inStock;
      updatedItem = db.products[idx];
      return db;
    });

    if (!updatedItem) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle product stock' });
  }
}

export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    let deletedItem = null;

    await updateDb((db) => {
      const idx = db.products?.findIndex((p) => p.id === id);
      if (idx === -1 || idx === undefined) {
        return db;
      }
      const removed = db.products.splice(idx, 1);
      deletedItem = removed[0];
      return db;
    });

    if (!deletedItem) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, deleted: deletedItem });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
}

export default {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleStock,
  deleteProduct,
};
